from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from api.serializers_jwt import CustomTokenObtainPairView
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Отдаём логотипы из папки frontend/public/images
    path('images/<path:path>', serve, {'document_root': os.path.join(settings.BASE_DIR, 'frontend/public/images')}),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Все остальные маршруты отдаём React (SPA)
urlpatterns += [re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='spa')]