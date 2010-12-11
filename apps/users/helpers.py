import json

from jingo import register, env


@register.function
def json_user(user):
    """Return a URL to the user's profile."""
    return json.dumps({'id': user.id, 'username': user.username,
                       'is_authenticated': user.is_authenticated()})
