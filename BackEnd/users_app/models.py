from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class CustomUser(AbstractUser):
    email=models.EmailField(unique=True)
    mobile=models.CharField(max_length=15,null=True,blank=True)
    otp = models.CharField(max_length=6, null=True, blank=True)

    Role_Choices=(
        ('admin','Admin'),
        ('user','User'),
    )
    role=models.CharField(max_length=10,choices=Role_Choices,default='user')

    Status_Choices=(
        ('active','Active'),
        ('inactive','Inactive'),
    )
    status=models.CharField(max_length=10,choices=Status_Choices,default='active')

    groups=models.ManyToManyField(
        'auth.Group',
        blank=True,
        help_text='the groups this user belong to.',
        verbose_name='groups'
    )

    user_permissions=models.ManyToManyField(
        'auth.Permission',
        related_name='csutomeruser_set',
        blank=True,
        help_text='specific permission for this user',
        verbose_name='user permissions'
    )

    def __str__(self):
        return self.username
    
class Address(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    pincode = models.CharField(max_length=10)
    address = models.TextField(verbose_name="Address")
    landmark = models.CharField(max_length=100, null=True, blank=True)
    address_type = models.CharField(
        max_length=20, 
        choices=[('Home', 'Home'), ('Work', 'Work') ,('Other', 'Other')], 
        default='Home'
    )
    is_default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super(Address, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.name}"