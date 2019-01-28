FROM node:11

WORKDIR /app

COPY . /app

RUN npm i

RUN /bin/bash -c 'curl -L https://deno.land/x/install/install.sh | sh'

CMD ["npm", "start"]
