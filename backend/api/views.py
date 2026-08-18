import random
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import *
from .serializers import *
from .permissions import IsAdminOrReadOnly
from .utils import compare_weapon


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class WeaponViewSet(viewsets.ModelViewSet):
    queryset = Weapon.objects.filter(is_deleted=False)
    serializer_class = WeaponSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeaponWriteSerializer
        return WeaponSerializer

    @action(detail=False, methods=['get'])
    def random(self, request):
        weapons = self.get_queryset()
        if not weapons.exists():
            return Response({'error': 'No weapons found'}, status=404)
        weapon = random.choice(weapons)
        serializer = WeaponSerializer(weapon)
        return Response(serializer.data)


class GameSessionViewSet(viewsets.ModelViewSet):
    queryset = GameSession.objects.all()
    serializer_class = GameSessionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return self.queryset.filter(user=self.request.user)
        return GameSession.objects.none()

    @action(detail=False, methods=['post'])
    def start(self, request):
        weapons = Weapon.objects.filter(is_deleted=False)
        if not weapons.exists():
            return Response({'error': 'No weapons available'}, status=400)

        weapon = random.choice(weapons)
        max_attempts = request.data.get('max_attempts', 6)

        user = request.user if request.user.is_authenticated else None

        session = GameSession.objects.create(
            user=user,
            weapon=weapon,
            max_attempts=max_attempts,
            status='active'
        )

        serializer = GameSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='guess', url_name='guess')
    def make_guess(self, request, pk=None):
        # Проверяем, что сессия существует и принадлежит пользователю (или гостю)
        if request.user.is_authenticated:
            session = get_object_or_404(self.get_queryset(), pk=pk)
        else:
            session = get_object_or_404(GameSession, pk=pk, user__isnull=True)

        if session.status != 'active':
            return Response({'error': 'Session is already finished'}, status=400)

        if session.attempts_used >= session.max_attempts:
            return Response({'error': 'No attempts left'}, status=400)

        weapon_name = request.data.get('weapon_name')
        if not weapon_name:
            return Response({'error': 'weapon_name is required'}, status=400)

        # 🔥 Ищем по русскому названию (name_ru), а если нет — по английскому (name)
        guessed_weapon = Weapon.objects.filter(
            Q(name_ru__iexact=weapon_name) | Q(name__iexact=weapon_name),
            is_deleted=False
        ).first()

        if not guessed_weapon:
            return Response({
                'error': 'Weapon not found',
                'weapon_name': weapon_name
            }, status=404)

        comparison = compare_weapon(guessed_weapon, session.weapon)

        attempt = Attempt.objects.create(
            session=session,
            attempt_no=session.attempts_used + 1,
            input_text=weapon_name,
            guessed_weapon=guessed_weapon,
            comparison_result=comparison
        )

        session.attempts_used += 1

        is_correct = all(item.get('match') in ['exact', 'partial'] 
    for item in comparison.values()
)

        if is_correct:
            session.result = 'win'
            session.status = 'finished'
            session.finished_at = timezone.now()
        elif session.attempts_used >= session.max_attempts:
            session.result = 'loss'
            session.status = 'finished'
            session.finished_at = timezone.now()

        session.save()

        # 🔥 Добавляем русское название в ответ
        correct_weapon_name = session.weapon.name_ru or session.weapon.name

        response_data = {
            'attempt': AttemptSerializer(attempt).data,
            'comparison': comparison,
            'remaining_attempts': session.max_attempts - session.attempts_used,
            'is_correct': is_correct,
            'game_over': session.status == 'finished',
            'result': session.result if session.status == 'finished' else None,
            'correct_weapon': correct_weapon_name
        }

        return Response(response_data)


class StatisticViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        sessions = GameSession.objects.filter(user=request.user, status='finished')
        total_games = sessions.count()
        wins = sessions.filter(result='win').count()
        losses = sessions.filter(result='loss').count()
        win_rate = (wins / total_games * 100) if total_games > 0 else 0

        avg_attempts = sessions.aggregate(avg=Avg('attempts_used'))['avg'] or 0

        last_games = sessions.order_by('-finished_at')[:10].values(
            'id', 'weapon__name', 'result', 'attempts_used', 'finished_at'
        )

        return Response({
            'total_games': total_games,
            'wins': wins,
            'losses': losses,
            'win_rate': round(win_rate, 1),
            'avg_attempts': round(avg_attempts, 1),
            'last_games': list(last_games)
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def leaderboard(self, request):
        users = User.objects.annotate(
            total_games=Count('gamesession', filter=Q(gamesession__status='finished')),
            wins=Count('gamesession', filter=Q(gamesession__result='win')),
            avg_attempts=Avg('gamesession__attempts_used', filter=Q(gamesession__status='finished'))
        ).filter(total_games__gte=5).order_by('-wins', 'avg_attempts')[:10]

        result = []
        for user in users:
            win_rate = (user.wins / user.total_games * 100) if user.total_games > 0 else 0
            result.append({
                'username': user.login,
                'total_games': user.total_games,
                'wins': user.wins,
                'win_rate': round(win_rate, 1),
                'avg_attempts': round(user.avg_attempts or 0, 1)
            })

        return Response(result)