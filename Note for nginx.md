## Part I: Load Balancing and HTTP Caching



### Chapter 1. High Performance and load balancing



#### 1.1 HTTP load balancing

**Problem**

You need to distribute load between two or more HTTP servers.

**Solution**

```nginx
upstream backend {
    server 10.10.12.45:80		weight=1;
    server app.example.com:80	weight=2;
}
server {
    location / {
        proxy_pass http:backend;
    }
}
```

**Discussion**

The HTTP upstream module controls the load balancing for HTTP. This module defines a pool of destinations, either a list of Unix sockets, IP addresses, and DNS records, or a mix.



Each upstream destination is defined in the upstream pool by the server directive. The server directive is provided a Unix socket, IP address, or an FQDN, along with a number of optional parameters. The optional parameters give more control over the routing of requests. These parameters include the weight of the server in the balancing algorithm; whether the server is in standby mode, available, or unavailable; and how to determine if the server is unavailable.



#### 1.2 TCP Load Balancing

**Problem**

You need to distribute load between two or more TCP servers.

**Solution**

```nginx
stream {
    upstream mysql_read {
        server read1.example.com:3306	weight=5;
        server read1.example.com:3306;
        server 10.10.12.34:3306			backup;
    }
    server {
        listen 3306;
        proxy_pass mysql_read;
    }
}
```

The server block in this example instructs NGINX to listen on TCP port 3306 and balance load between two MySQL database read replicas, and lists another as a backup that will be passed traffic if the primaries are down.



**Discussion**

TCP load balancing is defined by the NGINX stream module. The stream module, like the HTTP module, allows you to define upstream pools of servers and configure a listening server.

The upstream for TCP load balancing is much like the upstream for HTTP.



#### 1.3 Load Balancing Methods

**Problem**

Round-robin load balancing doesn’t fit your use case because you have heterogeneous workloads or server pools.

**Solution**

Use one of NGINX’s load-balancing methods, such as least connections, least time, generic hash, or IP hash:

```nginx
upstream backend {
    least_conn;
    server backend1.example.com;
	server backend2.example.com;
}
```

**Discussion**

What is the difference between different LB methods? How to choose one for your project?

##### Round robin

The default load-balancing method, which distributes requests in order of the list of servers in the upstream pool. Weight can be taken into consideration for a weighted round robin, which could be used if the capacity of the upstream servers varies. The higher the integer value for the weight, the more favored the server will be in the round robin. The algorithm behind weight is simply statistical probability of a weighted average. Round robin is the default load-balancing algorithm and is used if no other algorithm is specified.

##### Least connections

Another load-balancing method provided by NGINX. This method balances load by proxying the current request to the upstream server with the least number of open connections proxied through NGINX. Least connections, like round robin, also takes weights into account when deciding to which server to send the connection. The directive name is __least_conn__.

##### Least time

Available only in NGINX Plus, is akin to least connections in that it proxies to the upstream server with the least number of current connections but favors the servers with the lowest average response times. This method is one of the most sophisticated load-balancing algorithms out there and fits the need of highly performant web applications.

##### Generic hash

The administrator defines a hash with the given text, variables of the request or runtime, or both. NGINX distributes the load amongst the servers by producing a hash for the current request and placing it against the upstream servers. This method is very useful when you need more control over where requests are sent or determining what upstream server most likely will have the data cached. Note that when a server is added or removed from the pool, the hashed requests will be redistributed. This algorithm has an optional parameter, consistent , to minimize the effect of redistribution. The directive name is __hash__ .

##### IP hash

Only supported for HTTP, is the last of the bunch. IP hash uses the client IP address as the hash. Slightly different from using the remote variable in a generic hash, this algorithm uses the first three octets of an IPv4 address or the entire IPv6 address. This method ensures that clients get proxied to the same
upstream server as long as that server is available, which is extremely helpful when the session state is of concern and not handled by shared memory of the application. This method also takes the weight parameter into consideration when distributing the hash. The directive name is __ip_hash__ .



#### 1.4 Connection Limiting

**Problem**

You have too much load overwhelming your upstream servers.

**Solution**

Use NGINX Plus’s max_conns parameter to limit connections to upstream servers:

```nginx
upstream backend {
    zone backends 64k;
    queue 750 timeout=30s;
    
    server webserver1.example.com max_conns=25;
    server webserver2.example.com max_conns=15;
}
```

The connection-limiting feature is currently only available in NGINX Plus. This NGINX Plus configuration sets an integer on each upstream server that specifies the max number of connections to be handled at any given time. If the max number of connections has been reached on each server, the request can be placed into the queue for further processing, provided the optional queue directive is specified. The optional queue directive sets the maximum number of requests that can be simultaneously in the queue. A shared memory zone is created by use of the zone directive. The shared memory zone allows NGINX Plus worker processes to share information about how many connections are handled by each server and how many requests are queued.

**Discussion**

In dealing with distribution of load, one concern is overload. Overloading a server will cause it to queue connections in a listen queue. If the load balancer has no regard for the upstream server, it can load the server’s listen queue beyond repair. The ideal approach is for the load balancer to be aware of the connection limitations of the server and queue the connections itself so that it can send the connection to the next available server with understanding of load as a whole. Depending on the upstream server to process its own queue will lead to poor user experience as connections start to timeout. NGINX Plus provides a solution by allowing connections to queue at the load balancer and by making informed decisions on where it sends the next request or session.



### Chapter 2. Intelligent Session Persistence

Only available in NGINX Plus.



### Chapter 3. Application-Aware Health Checks

For a number of reasons, applications fail. It could be because of network connectivity, server failure, or application failure, to name a few. Proxies and load balancers must be smart enough to detect failure of upstream servers and stop passing traffic to them; otherwise, the client will be waiting, only to be delivered a timeout. A way to mitigate service degradation when a server fails is to have the proxy check the health of the upstream servers. NGINX offers two different types of health checks: __passive__, available in the open source version; as well as __active__, available only in NGINX Plus.



#### 3.1 What to check

**Problem**

You need to check your application for health but don’t know what to check.

**Solution**

Use a simple but direct indication of the application health. For example, a handler that simply returns an HTTP 200 response tells the load balancer that the application process is running.

**Discussion**

It’s important to check the core of the service you’re load balancing for. A single comprehensive health check that ensures all of the systems are available can be problematic. Health checks should check that the application directly behind the load balancer is available over the network and that the application itself is running. With application-aware health checks, you want to pick an endpoint that simply ensures that the processes on that machine are running. It may be tempting to make sure that the database connection strings are correct or that the application can contact its resources. However, this can cause a cascading effect if any particular service fails.

#### 3.2 Slow Start

**Problem**

Your application needs to ramp up before taking on full production load.

**Solution**

```nginx
upstream {
	zone backend 64k;
    
    server server1.example.com slow_start=20s;
    server server2.example.com slow_start=15s;
}
```

The server directive configurations will slowly ramp up traffic to the upstream servers after they’re reintroduced to the pool. server1 will slowly ramp up its number of connections over 20 seconds, and
server2 over 15 seconds.

**Discussion**

Slow start allows the application to warm up by populating caches, initiating database connections without being overwhelmed by connections as soon as it starts. This feature takes effect when a server that has failed health checks begins to pass again and re-enters the load-balancing pool.



