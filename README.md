# Introduction

In this experiment, my group will be using [Percona Server for MongoDB](https://www.percona.com/mongodb/software/percona-server-for-mongodb) as our NoSQL setup.

We will be comparing the query speed between encrypted vs non-encrypted setup.


# Requirements

1. [Docker Desktop](https://www.docker.com/)


# Setup

**Note: Change "cleme" to your username.**

1. Create folder and key file
   Open PowerShell and run:

   ```
   mkdir C:\Users\cleme\Downloads\mongo_keys
   mkdir C:\Users\cleme\Downloads\mongo_data_encrypted
   mkdir C:\Users\cleme\Downloads\mongo_data_plain

   echo mysecretkey > C:\Users\cleme\Downloads\mongo_keys\mongodb-keyfile
   ```
