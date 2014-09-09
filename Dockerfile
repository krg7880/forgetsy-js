# DOCKER-VERSION 0.8
FROM    centos

MAINTAINER kirk7880@gmail.com

# Install git
RUN yum install -y git

# Enable EPEL for Node.js
RUN     rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# Install NVM
RUN			bash -c "curl https://raw.githubusercontent.com/creationix/nvm/v0.11.1/install.sh | bash"

RUN			bash -c "nvm install latest"

RUN			bash -c "nvm use latest"

RUN			bash -c "which node"

# Bundle app source
ADD 		. /var/nyt/forgetsy-js

# Install app dependencies and force a successful exit code
RUN 		cd /var/nyt/forgetsy-js; bash -c "npm install  . || true"
RUN 		bash -c "npm test"

CMD ["help"]
