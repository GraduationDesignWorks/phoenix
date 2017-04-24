## Deployment Guide

1. install mongodb on ur computer
2. install node on ur computer
3. in terminal, run
```bash
mongod
```
4. cd in the project directory, and run
```bash
npm install
npm start
```

# phoenix Api Guide

FORMAT: 1A
HOST: http://localhost:4090/api/

Polls is a simple API allowing consumers to view polls and vote in them.

## 注册 [/auth/register]

### register [POST]

+ Request (application/json)

        {
            "account": "",
            "password": "",
            "name": "",
            "avatar": ""
        }

+ Response 200 (application/json)

        {
            "result": {
                "user": {
                    "account": "",
                    "name": "",
                    "avatar": ""
                },
                "token": ""
            }
        }

## 登录 [/auth/login]

### login [POST]

+ Request (application/json)

        {
            "account": "",
            "password": ""
        }

+ Response 200 (application/json)

        {
            "result": {
                "user": {
                    "account": "",
                    "name": "",
                    "avatar": ""
                },
                "token": ""
            }
        }