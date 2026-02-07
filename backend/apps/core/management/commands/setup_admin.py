from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.core.models import UserProfile


class Command(BaseCommand):
    help = 'Create initial Super Admin user and set up existing users with profiles'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='admin', help='Admin username')
        parser.add_argument('--password', type=str, default='admin123', help='Admin password')
        parser.add_argument('--email', type=str, default='admin@eeu.gov.et', help='Admin email')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        # Ensure all existing users have profiles
        for user in User.objects.all():
            if not hasattr(user, 'profile'):
                UserProfile.objects.create(user=user)
                self.stdout.write(f'Created profile for existing user: {user.username}')

        # Create or update admin user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True,
            }
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created Super Admin user: {username}'))
        else:
            self.stdout.write(f'User {username} already exists')

        # Ensure profile exists and set role to SUPER_ADMIN
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role='SUPER_ADMIN')
        else:
            user.profile.role = 'SUPER_ADMIN'
            user.profile.save()

        self.stdout.write(self.style.SUCCESS(f'User {username} is now a Super Admin'))
        self.stdout.write(f'\nLogin credentials:')
        self.stdout.write(f'  Username: {username}')
        self.stdout.write(f'  Password: {password}')
