from django.urls import path
from .views import index

app_name = "frontend"

# add name for redirect function
urlpatterns = [
    path('', index, name=''),
    path("join", index),
    path("create", index),
    path("room/<str:roomCode>", index),
]