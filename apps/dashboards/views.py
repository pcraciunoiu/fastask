import jingo


def main(request):
    return jingo.render(request, 'dashboards/main.html', {'a': 'bcd'})
