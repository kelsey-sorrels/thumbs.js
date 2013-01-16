thumbs.js
=========

Heroku-supported website thumbnail webservice backed by S3

<img src="http://thumbs-js.herokuapp.com/thumb?href=http://google.com&size=300"/>

To use:
```
git clone https://github.com/aaron-santos/thumbs.js.git
heroku apps:create <your-app-name>
heroku config:set AWS_ACCESS_KEY=<your-access-key> AWS_SECRET_KEY=<your-secret-key> AWS_BUCKET=<your-s3-bucket-name>
git push heroku master
```
Access your thumbs at:
```
http://<your-app-name>.herokuapp.com/thumb?href=http://google.com&size=100
```
The Heroku router may timeout your request before you recieve a response. If you request again after waiting a moment,
you will be redirected to your thumbnail image.
