# Chat Web-application Using Micro Services Architecture

## Build the server environments.
The run.sh script automatically creates four individual servers by docker. 
```bash
# creates four individual servers by docker
sh run.sh  
```

## Guildline
- Go to http://localhost:29000 for user login, sign-up, and chating.
- http://localhost:8081/ provides UI interface for user account management. [username: admin / password: password]
 
## Topology
- webChat-login-api uses port 26000
- webChat-management-api uses port 27000
- webChat-server uses port 28000
- webChat-production-server uses port 29000
<img src="https://juepingw21.github.io/img/chat-diagram.png" width=75% height=75%>

