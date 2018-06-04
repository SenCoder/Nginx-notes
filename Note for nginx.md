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



#### 3.3 TCP Health Checks

**Problem**

You need to check your upstream TCP server for health and remove unhealthy servers from the pool.

**Solution**

Use the __health_check__ directive in the server block for an active health check:

```nginx
stream {
    server {
        listen			3306;
        proxy_pass		read_backend;
        health_check	health_check interval=10 passes=2 fails=3;
    }
}
```

The example monitors the upstream servers actively. The upstream server will be considered unhealthy if it fails to respond to three or more TCP connections initiated by NGINX. NGINX performs the check every 10 seconds. The server will only be considered healthy after passing two health checks. 

**Discussion**

TCP health can be verified by NGINX Plus either passively or actively.  Passive health monitoring is done by noting the communi‐ cation between the client and the upstream server. If the upstream server is timing out or rejecting connections, a passive health check will deem that server unhealthy. Active health checks will initiate their own configurable checks to determine health. Active health checks not only test a connection to the upstream server, but can expect a given response. 



#### 3.4 HTTP Health Checks

**Problem**

You need to actively check your upstream HTTP servers for health.

**Solution**

Use the __health_check__ directive in a location block:

```nginx
http {
    server {
        location / {
            proxy_pass 		http://backend;
            health_check	interval=2s
                			fails=2
                			passes=2
                			uri=/
                			match=welcome;
        }
    }
    # status is 200, content type is "text/html",
    # and body contains "Welcome to nginx!"
    match welcome {
        status 200;
        header Content-type= text/html;
        body ~ "Welcome to nginx!";
    }
}
```

This health check configuration for HTTP servers checks the health of the upstream servers by making an HTTP request to the URI '/' every two seconds. The upstream servers must pass five consecutive health checks to be considered healthy and will be considered unhealthy if they fail two consecutive checks.  

**Discussion**

HTTP health checks in NGINX Plus can measure more than just the response code. In NGINX Plus, active HTTP health checks monitor based on a number of acceptance criteria of the response from the upstream server. Active health check monitoring can be configured for how often upstream servers are checked, the URI to check, how many times it must pass this check to be considered healthy, how many times it can fail before being deemed unhealthy, and what the expected result should be. 



### Chapter 4. High-Availability Development Modes

#### 4.1 NGINX HA Mode

**Problem**

You need a highly available load-balancing solution. 

**Solution**

Use NGINX Plus’s HA mode with keepalived by installing the nginx-ha-keepalived package from the NGINX Plus repository. 



#### 4.2 Load-Balancing Load Balancers with DNS

**Problem**

You need to distribute load between two or more NGINX servers. 

**Solution**

Use DNS to round robin across NGINX servers by adding multiple IP addresses to a DNS A record. 



4.3 Load Balancing on EC2

**Problem**

You’re using NGINX in AWS, and the NGINX Plus HA does not support Amazon IPs. 

**Solution**

Put NGINX behind an elastic load balancer by configuring an Auto Scaling group of NGINX servers and linking the Auto Scaling group to the elastic load balancer. Alternatively, you can place NGINX servers into the elastic load balancer manually through the Amazon Web Services console, command-line interface, or API. 

**Discussion**

The HA solution from NGINX Plus based on keepalived will not work on Amazon Web Services because it does not support the floating virtual IP address, as EC2 IP addresses work in a different way. This does not mean that NGINX can’t be HA in the AWS cloud; in fact, it’s the opposite. The AWS elastic load balancer is a product offering from Amazon that will natively load balance over multiple, physically separated data centers called availability zones, provide active health checks, and provide a DNS CNAME endpoint. A com‐ mon solution for HA NGINX on AWS is to put an NGINX layer behind the ELB. NGINX servers can be automatically added to and removed from the ELB pool as needed. The ELB is not a replace‐ ment for NGINX; there are many things NGINX offers that the ELB does not, such as multiple load-balancing methods, context switch‐ ing, and UDP load balancing. 



### Chapter 5. Massively Scalable Content Caching

#### 5.1 Caching Zones

**Problem**

You need to cache content and need to define where the cache is stored.

**Solution**

Use the __proxy_cache_path__ directive to define shared memory cache zones and a location for the content: 

```nginx
proxy_cache_path 	/var/nginx/cache
					keys_zone=CACHE:60m
					levels=1:2
					inactive=3h
					max_size=20g;
proxy_cache CACHE;
```

This example creates a directory for cached respon‐ ses on the filesystem at /var/nginx/cache and creates a shared mem‐ ory space named CACHE with 60 megabytes of memory. 



This example sets the directory structure levels, defines the release of cached responses after they have not been requested in 3 hours, and defines a maximum size of the cache of 20 gigabytes. The proxy_cache directive informs a particular context to use the cache zone. The proxy_cache_path is valid in the HTTP context, and the proxy_cache directive is valid in the HTTP, server, and location contexts. 

**Discussion**

To configure caching in NGINX, it’s necessary to declare a path and zone to be used. A cache zone in NGINX is created with the direc‐ tive proxy_cache_path. The proxy_cache_path designates a loca‐ tion to store the cached information and a shared memory space to store active keys and response metadata. Optional parameters to this directive provide more control over how the cache is maintained and accessed. The levels parameter defines how the file structure is created. The value is a colon-separated value that declares the length of subdirectory names, with a maximum of three levels. NGINX caches based on the cache key, which is a hashed value. NGINX then stores the result in the file structure provided, using the cache key as a file path and breaking up directories based on the levels value. The inactive parameter allows for control over the length of time a cache item will be hosted after its last use. The size of the cache is also configurable with use of the max_size parameter. 



#### 5.2 Caching Hash Keys

**Problem**

You need to control how your content is cached and looked up. 

**Solution**

Use the proxy_cache_key directive, along with variables to define what constitutes a cache hit or miss: 

```nginx
proxy_cache_key "$host$request_uri $cookie_user";
```

**Discussion**



#### 5.3 Cache Bypass

**Problem** 

You need the ability to bypass the caching. 定义在哪些情况下不从cache读取，直接从backend获取资源。

**Solution**

Use the proxy_cache_bypass directive with a nonempty or nonzero value. One way to do this is by setting a variable within location blocks that you do not want cached to equal 1: 

```
proxy_cache_bypass $http_cache_bypass;
```

The configuration tells NGINX to bypass the cache if the HTTP request header named cache_bypass is set to any value that is not 0. 

**Discussion**

There are many scenarios that demand that the request is not cached. For this, NGINX exposes a proxy_cache_bypass directive that when the value is nonempty or nonzero, the request will be sent to an upstream server rather than be pulled from cache. 

You can also turn off cache completely for a given context such as a location block by setting proxy_cache off;. 



#### 5.4 Cache Performance

**Problem**

You need to increase performance by caching on the client side. 

**Solution**

```nginx
location ~* \.(css|js)$ {
    expires		1y;
    add_header Cache-Control "public";
}
```

This location block specifies that the client can cache the content of CSS and JavaScript files. The expires directive instructs the client that their cached resource will no longer be valid after one year. The add_header directive adds the HTTP response header Cache- Control to the response, with a value of public, which allows any caching server along the way to cache the resource. If we specify pri‐ vate, only the client is allowed to cache the value. 

**Discussion**

#### 5.5 Purging

**Problem**

You need to invalidate an object from the cache. 

**Solution**

Only accessible in Nginx Plus:

```nginx
map $request_method $purge_method {
    PURGE 1;
	default 0;
}
server { ...
        location / {
            ...
            proxy_cache_purge $purge_method;
        }
}
```



### Chapter 6. Sophisticated Media Streaming

#### 6.1 Serving MP4 and FLV

**Problem**

You need to stream digital media, originating in MPEG-4 (MP4) or Flash Video (FLV). 

**Solution**

Designate an HTTP location block as .mp4 or . v. NGINX will stream the media using progressive downloads or HTTP pseudos‐ treaming and support seeking: 

```nginx
http {
    server {
		...
        location /videos/ {
        	mp4;
		}
        location ~ \.flv$ {
        	flv;
		}
    }
}
```

The example location block tells NGINX that files in the videos directory are of MP4 format type and can be streamed with progres‐ sive download support. The second location block instructs NGINX that any files ending in . v are of Flash Video format and can be streamed with HTTP pseudostreaming support. 

Streaming video or audio files in NGINX is as simple as a single directive. Progressive download enables the client to initiate play‐ back of the media before the file has finished downloading.  



#### 6.2 Streaming with HLS

Only accessible in Nginx Plus.

#### 6.3 Streaming with HDS

Only accessible in Nginx Plus.

#### 6.4 Bandwidth Limits

Only accessible in Nginx Plus.



### Chapter 7. Advanced Activity Monitoring

Only accessible in Nginx Plus.



## Part II: Security and Access

### Chapter 8. Controlling Access

#### 8.1 Access Based on IP Address 

**Problem**

You need to control access based on the IP address of the client. 

**Solution**

Use the HTTP access module to control access protected resources:

```nginx
location /admin/ {
    deny 10.0.0.1;
    allow 10.0.0.0/20;
    allow 2001:0db8::/32;
    deny all;
}
```

The given location block allows access from any IPv4 address in 10.0.0.0/20 except 10.0.0.1, allows access from IPv6 addresses in the 2001:0db8::/32 subnet, and returns a 403 for requests originating from any other address. 



#### 8.2 Allowing Cross-Origin Resource Sharing 

**Problem**

You’re serving resources from another domain and need to allow CORS to enable browsers to utilize these resources. 

**Solution**

```nginx
map $request_method $cors_method {
	OPTIONS 11;
	GET 1;
	POST 1;
	default 0;
}

server {
    ...
    location / {
        if ($cors_method ~ '1') {
            add_header 'Access-Control-Allow-Methods' 'GET,POST,OPTIONS';
            add_header 'Access-Control-Allow-Origin' '*.example.com';
            add_header 'Access-Control-Allow-Headers' 'DNT, Keep-Alive, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control, Content-Type';
        }
        if ($cors_method = '11') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

The OPTIONS request method returns information called a pre ight request to the client about this server’s CORS rules. OPTIONS, GET, and POST methods are allowed under CORS. Setting the Access- Control-Allow-Origin header allows for content being served from this server to also be used on pages of origins that match this header. The preflight request can be cached on the client for 1,728,000 seconds, or 20 days.

**Discussion**

Resources such as JavaScript make cross-origin resource requests when the resource they’re requesting is of a domain other than its own origin. When a request is considered cross origin, the browser is required to obey CORS rules. The browser will not use the resource if it does not have headers that specifically allow its use. To allow our resources to be used by other subdomains, we have to set the CORS headers, which can be done with the add_header direc‐ tive. If the request is a GET, HEAD, or POST with standard content type, and the request does not have special headers, the browser will make the request and only check for origin. Other request methods will cause the browser to make the preflight request to check the terms of the server to which it will obey for that resource. If you do not set these headers appropriately, the browser will give an error when trying to utilize that resource. 



### Chapter 9. Limiting Use

#### 9.1 Limiting Connections

**Problem**

You need to limit the number of connections based on a predefined key, such as the client’s IP address. 

**Solution**

```nginx
http {
    limit_conn_zone $binary_remote_addr zone=limitbyaddr:10m;
    limit_req_status 429;
    ...
    server {
    	...
    	limit_conn limitbyaddr 40;
        ...
    }
}
```



#### 9.2 Limiting Rate

**Problem**

You need to limit the rate of requests by predefined key, such as the client’s IP address. 

**Solution**

Utilize the rate-limiting module to limit the rate of requests: 

```nginx
http {
    limit_req_zone $binary_remote_addr
        zone=limitbyaddr:10m rate=1r/s;
    limit_req_status 429;
    ...
    server {
    	...
            limit_req zone=limitbyaddr burst=10 nodelay;
        ...
    }
}
```



#### 9.3 Limiting Bandwidth



### Chapter 10. Encrypting

#### 10.1 Client-Side Encryption

**Problem**

You need to encrypt traffic between your NGINX server and the client. 

**Solution**

Utilize one of the SSL modules, such as the __ngx_http_ssl_module__ or __nginx_stream_ssl_module__ to encrypt traffic:

```nginx
http { # All directives used below are also valid in stream
    server {
        listen 8443 ssl;
        ssl_protocols		TLSv1.2;
        ssl_ciphers			HIGH:!aNULL:!MD5;
        ssl_certificate		/usr/local/nginx/conf/cert.pem;
        ssl_certificate_key	/usr/local/nginx/conf/cert.key;
        ssl_session_cache	shared:SSL:10m;
        ssl_session_timeout 10m;
    }
}
```

#### 10.2 Upstream Encryption

**Problem**

You need to encrypt traffic between NGINX and the upstream ser‐ vice and set specific negotiation rules for compliance regulations or if the upstream is outside of your secured network. 

**Solution**

```nginx
location / {
	proxy_pass https://upstream.example.com;
    proxy_ssl_verify on;
    proxy_ssl_verify_depth 2;
    proxy_ssl_protocols TLSv1.2;
}
```

