from django.db import models

class WeaponClass(models.Model):
    code = models.CharField(max_length=10, primary_key=True)
    name_ru = models.CharField(max_length=50)
    name_en = models.CharField(max_length=50)
    color = models.CharField(max_length=7, null=True, blank=True)
    icon = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.name_ru

class WeaponSlot(models.Model):
    code = models.CharField(max_length=10, primary_key=True)
    name_ru = models.CharField(max_length=50)
    name_en = models.CharField(max_length=50)

    def __str__(self):
        return self.name_ru

