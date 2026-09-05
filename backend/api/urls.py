from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'weapons', WeaponViewSet)
router.register(r'sessions', GameSessionViewSet, basename='session')
router.register(r'stats', StatisticViewSet, basename='stats')

urlpatterns = [
    path('', include(router.urls)),
]