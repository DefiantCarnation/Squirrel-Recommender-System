# start from latest ubuntu image
FROM ubuntu:latest
MAINTAINER mikekawong@gmail.com
# update to see if changes have been made, if first time download node and npm
RUN apt-get update 
RUN apt-get install -y nodejs nodejs-legacy npm
RUN apt-get clean
#copy package.json from host directory into src folder
COPY ./package.json src/
#npm install if necessary
RUN cd src && npm install
# copy ALL applications folders into src folder of container
COPY . /src
WORKDIR /src

EXPOSE 3121