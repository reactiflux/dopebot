FROM node:11

WORKDIR /app

COPY . /app

RUN npm i

RUN /bin/bash -c 'curl -fsSL https://deno.land/x/install/install.sh | sh -s v0.3.3'

ENV PATH="/root/.deno/bin:$PATH"

CMD ["npm", "start"]
