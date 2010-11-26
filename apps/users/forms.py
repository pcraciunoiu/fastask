from django import forms
from django.contrib.auth.models import User


USERNAME_INVALID = ('Username may contain only letters, '
                    'numbers and @/./+/-/_ characters.')
USERNAME_REQUIRED = 'Username is required.'
USERNAME_SHORT = ('Username is too short (%(show_value)s characters). '
                  'It must be at least %(limit_value)s characters.')
USERNAME_LONG = ('Username is too long (%(show_value)s characters). '
                 'It must be %(limit_value)s characters or less.')
EMAIL_REQUIRED = 'Email address is required.'
EMAIL_SHORT = ('Email address is too short (%(show_value)s characters). '
               'It must be at least %(limit_value)s characters.')
EMAIL_LONG = ('Email address is too long (%(show_value)s characters). '
              'It must be %(limit_value)s characters or less.')
PASSWD_REQUIRED = 'Password is required.'
PASSWD2_REQUIRED = 'Please enter your password twice.'


class RegisterForm(forms.ModelForm):
    """A user registration form that requires unique email addresses.

    The default Django user creation form does not require an email address,
    let alone that it be unique. This form does, and sets a minimum length
    for usernames.

    """
    username = forms.RegexField(
        label='Username:', max_length=30, min_length=4,
        regex=r'^[\w.@+-]+$',
        help_text=('Required. 30 characters or fewer. Letters, digits '
                   'and @/./+/-/_ only.'),
        error_messages={'invalid': USERNAME_INVALID,
                        'required': USERNAME_REQUIRED,
                        'min_length': USERNAME_SHORT,
                        'max_length': USERNAME_LONG})
    email = forms.EmailField(label='Email:',
                             error_messages={'required': EMAIL_REQUIRED,
                                             'min_length': EMAIL_SHORT,
                                             'max_length': EMAIL_LONG})
    password1 = forms.CharField(label='Password:',
                                widget=forms.PasswordInput(
                                    render_value=False),
                                error_messages={'required': PASSWD_REQUIRED})
    password2 = forms.CharField(label='Password again:',
                                widget=forms.PasswordInput(
                                    render_value=False),
                                error_messages={'required': PASSWD2_REQUIRED},
                                help_text = ('Enter the same password as '
                                              'above, for verification.'))

    class Meta(object):
        model = User
        fields = ('username', 'email', 'password1', 'password2')

    def clean(self):
        super(RegisterForm, self).clean()
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')

        if not password1 == password2:
            raise forms.ValidationError('Passwords must match.')

        return self.cleaned_data

    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('A user with that email address '
                                        'already exists.')
        return email
