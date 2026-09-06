from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        print(f"🔍 LoginBackend called with username={username}, password={password}")  # ← Добавить
        
        if username is None:
            return None
        try:
            user = User.objects.get(login=username)
            print(f"✅ User found: {user.login}")  # ← Добавить
        except User.DoesNotExist:
            print("❌ User not found")  # ← Добавить
            return None
        
        if user.check_password(password):
            print("✅ Password correct")  # ← Добавить
            return user
        print("❌ Password incorrect")  # ← Добавить
        return None