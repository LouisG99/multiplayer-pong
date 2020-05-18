from os import environ

bind = '0.0.0.0:' + environ.get('PORT', '5000')
worker_class = 'eventlet'
reload = True
