FROM python:3.8.0-alpine

WORKDIR /usr/src/app

RUN pip install --upgrade pip

COPY requirements.txt ./

RUN \
 apk add --no-cache python3 postgresql-libs && \
 apk add --no-cache --virtual .build-deps gcc python3-dev musl-dev postgresql-dev && \
 python3 -m pip install -r requirements.txt --no-cache-dir && \
 apk --purge del .build-deps

COPY . /usr/src/app/

EXPOSE 5000

RUN chmod +x dockerstart.sh

ENTRYPOINT [ "/usr/src/app/dockerstart.sh" ]
