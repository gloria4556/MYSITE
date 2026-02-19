from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


class UserProfileTests(APITestCase):
    def setUp(self):
        self.url = '/api/users/profile/'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword'
        )

    def test_auth_required(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 401)

    def test_get_user_profile(self):
        refresh = RefreshToken.for_user(self.user)
        access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get('email'), self.user.email)
        self.assertEqual(res.data.get('username'), self.user.username)

    def test_update_user_profile(self):
        refresh = RefreshToken.for_user(self.user)
        access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        payload = {'name': 'NewName', 'email': 'new@example.com', 'password': 'newpassword'}
        res = self.client.put(self.url, payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new@example.com')
        self.assertTrue(self.user.check_password('newpassword'))
        self.assertIn('token', res.data)
        self.assertEqual(res.data.get('email'), 'new@example.com')
        self.assertEqual(res.data.get('name'), 'NewName')


class UserAuthTests(APITestCase):
    def setUp(self):
        self.register_url = '/api/users/register/'
        self.login_url = '/api/users/login/'
        self.user = User.objects.create_user(
            username='authuser',
            email='auth@example.com',
            password='authpassword'
        )

    def test_register_user(self):
        payload = {
            'name': 'RegName',
            'email': 'reg@example.com',
            'password': 'regpass'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertIn('token', res.data)
        self.assertEqual(res.data.get('email'), 'reg@example.com')
        # User created in DB
        self.assertTrue(User.objects.filter(email='reg@example.com').exists())

    def test_login_with_email(self):
        payload = {'email': 'auth@example.com', 'password': 'authpassword'}
        res = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data)
        self.assertEqual(res.data.get('email'), 'auth@example.com')
        self.assertEqual(res.data.get('username'), 'authuser')


    def test_update_user_profile(self):
        refresh = RefreshToken.for_user(self.user)
        access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        payload = {'name': 'NewName', 'email': 'new@example.com', 'password': 'newpassword'}
        res = self.client.put(self.url, payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new@example.com')
        self.assertTrue(self.user.check_password('newpassword'))
        self.assertIn('token', res.data)
        self.assertEqual(res.data.get('email'), 'new@example.com')
        self.assertEqual(res.data.get('name'), 'NewName')
