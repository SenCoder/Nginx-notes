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



### Chapter 11. Http Basic Authentication

#### 11.1 Using Basic Authentication 

**Problem**

You need basic authentication to protect an NGINX location or server. 

**Solution**

You need an HTTP basic authentication user file to store usernames and passwords, which is conf.d/passwd. 

```nginx
location / {
    auth_basic				"Private site";
    auth_basic_user_file	conf.d/passwd;
}
```

The auth_basic directives can be used in the HTTP, server, or loca‐ tion contexts. The auth_basic directive takes a string parameter, which is displayed on the basic authentication pop-up window when an unauthenticated user arrives. The auth_basic_user_file speci‐ fies a path to the user file, which was just described in  11.1.



#### 11.2 Securing a Location 

**Problem**

You need to secure a location block using a secret. 

**Solution**

```nginx
location /resources {
secure_link_secret mySecret;
if ($secure_link = "") { return 403; }
    rewrite ^ /secured/$secure_link;
}
location /secured/ {
    internal;
    root /var/www;
}
```



#### 11.3 Generating a Secure Link with a Secret Problem 

**Problem**

You need to generate a secure link from your application using a secret. 

**Solution**

```shell
echo -n 'index.htmlmySecret' | openssl md5 -hex
% (stdin)= a53bee08a4bf0bbea978ddf736363a12
```

```python
import hashlib
hashlib.md5.(b'index.htmlmySecret').hexdigest()
# 'a53bee08a4bf0bbea978ddf736363a12'

```

```shell
curl www.example.com/resources/a53bee08a4bf0bbea978ddf736363a12/\
index.html
```

**Discussion**

Generating the digest can be done in many ways, in many languages. Things to remember: the URI path goes before the secret, there are no carriage returns in the string, and use the hex digest of the md5 hash. 



### Chapter 12. Practical Secure Tips

#### 12.1 HTTPS Redirects 

**Problem**

You need to redirect unencrypted requests to HTTPS. 

**Solution**

```nginx
server {
	listen 80 default_server;
	listen [::]:80 default_server; server_name _;
	return 301 https://$host$request_uri;
}
```

**Discussion**

It’s important to always redirect to HTTPS where appropriate. You may find that you do not need to redirect all requests but only those with sensitive information being passed between client and server. In that case, you may want to put the return statement in particular locations only, such as /login. 



#### 12.2 Redirecting to HTTPS Where SSL/TLS Is Terminated Before NGINX 

**Problem**

You need to redirect to HTTPS, however, you’ve terminated SSL/TLS at a layer before NGINX. 

**Solution**

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server; server_name _;
    if ($http_x_forwarded_proto = 'http') {
        return 301 https://$host$request_uri;
    }
}
```

**Discussion**

It’s a common use case that you may terminate SSL/TLS in a layer in front of NGINX. One reason you may do something like this is to save on compute costs. However, you need to make sure that every request is HTTPS, but the layer terminating SSL/TLS does not have the ability to redirect. It can, however, set proxy headers. This con‐ figuration works with layers such as the Amazon Web Services Elas‐ tic Load Balancer, which will offload SSL/TLS at no additional cost. This is a handy trick to make sure that your HTTP traffic is secured. 



##### 12.3 HTTP Strict Transport Security 

**Problem**

You need to instruct browsers to never send requests over HTTP. 

**Solution**

```nginx
add_header Strict-Transport-Security max-age=31536000;
```

This configuration sets the Strict-Transport-Security header to a max age of a year. This will instruct the browser to always do an internal redirect when HTTP requests are attempted to this domain, so that all requests will be made over HTTPS. 



## Part III: Deployment and Operations



### Chapter 13. Locating Users by IP Address Using the GeoIP Module

Logging is the basis of understanding your application. With NGINX you have great control over logging information meaning‐ ful to you and your application. NGINX allows you to divide access logs into different files and formats for different contexts and to change the log level of error logging to get a deeper understanding of what’s happening. The capability of streaming logs to a central‐ ized server comes innately to NGINX through its Syslog logging capabilities. In this chapter, we’ll discuss access and error logs, streaming over the Syslog protocol, and tracing requests end to end with request identifiers generated by NGINX. 

#### 13.1 Confguring Access Logs 

**Problem**

You need to configure access log formats to add embedded variables to your request logs. 

**Solution**

```nginx
http {
        log_format  geoproxy
                    '[$time_local] $remote_addr '
                    '$realip_remote_addr $remote_user '
                    '$request_method $server_protocol '
                    '$scheme $server_name $uri $status '
                    '$request_time $body_bytes_sent '
                    '$geoip_city_country_code3 $geoip_region '
                    '"$geoip_city" $http_x_forwarded_for '
                    '$upstream_status $upstream_response_time '
                    '"$http_referer" "$http_user_agent"';
}
```



### Chapter 14. Performance Tuning

#### 14.1 Automating Tests with Load Drivers

#### Problem

You need to automate your tests with a load driver to gain consis‐ tency and repeatability in your testing. 

**Solution**

Use an HTTP load testing tool such as Apache JMeter, Locust, Gatling, or whatever your team has standardized on. 

#### 14.2 Keeping Connections Open to Clients

**Problem**

You need to increase the number of requests allowed to be made over a single connection from clients and the amount of time idle connections are allowed to persist. 

**Solution**

```nginx
http {
        keepalive_requests 320;
        keepalive_timeout 300s;
}
```



#### 14.3 Keeping Connections Open Upstream

**Problem**

You need to keep connections open to upstream servers for reuse to enhance your performance. 

**Solution**

Use the keepalive directive in the upstream context to keep con‐ nections open to upstream servers for reuse: 

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
upstream backend {
    server 10.0.0.42;
    server 10.0.2.56;
    keepalive 32;
}
```



##### 14.4 Buffering Responses 

**Problem**

You need to buffer responses between upstream servers and clients in memory to avoid writing responses to temporary files. 

**Solution**

Tune proxy buffer settings to allow NGINX the memory to buffer response bodies: 

```nginx
server {
    proxy_buffering on;
    proxy_buffer_size 8k;
    proxy_buffers 8 32k;
    proxy_busy_buffer_size 64k;
}
```

The proxy_buffering directive is either on or off; by default it’s on. The proxy_buffer_size denotes the size of a buffer used for read‐ ing the first part of the response from the proxied server and defaults to either 4k or 8k, depending on the platform. 

**Discussion**

Proxy buffers can greatly enhance your proxy performance, depend‐ ing on the typical size of your response bodies. Tuning these settings can have adverse effects and should be done by observing the aver‐ age body size returned, and thoroughly and repeatedly testing. 



#### 14.5 Buffering Access Logs

**Problem**

You need to buffer logs to reduce the opportunity of blocks to the NGINX worker process when the system is under load. 

**Solution**

```nginx

http {
    access_log /var/log/nginx/access.log main buffer=32k
		flush=1m;
}
```

The buffer parameter of the access_log directive denotes the size of a memory buffer that can be filled with log data before being written to disk. The flush parameter of the access_log directive sets the longest amount of time a log can remain in a buffer before being written to disk. 



#### 14.6 OS Tuning

**Problem**

You need to tune your operating system to accept more connections to handle spike loads or highly trafficked sites. 

**Solution**

Check the kernel setting for net.core.somaxconn, which is the maxi‐ mum number of connections that can be queued by the kernel for NGINX to process. 



Raising the number of open file descriptors is a more common need. In Linux, a file handle is opened for every connection; and therefore NGINX may open two if you’re using it as a proxy or load balancer because of the open connection upstream. To serve a large number of connections, you may need to increase the file descriptor limit system-wide with the kernel option sys.fs.file_max, or for the system user NGINX is running as in the /etc/security/limits.conf file. When doing so you’ll also want to bump the number of worker_connections and worker_rlimit_nofile. 



Enable more ephemeral ports. When NGINX acts as a reverse proxy or load balancer, every connection upstream opens a temporary port for return traffic. Depending on your system configuration, the server may not have the maximum number of ephemeral ports open. To check, review the setting for the kernel set‐ ting net.ipv4.ip_local_port_range. The setting is a lower- and upper- bound range of ports. It’s typically OK to set this kernel set‐ ting from 1024 to 65535. 1024 is where the registered TCP ports stop, and 65535 is where dynamic or ephemeral ports stop. Keep in mind that your lower bound should be higher than the highest open listening service port. 



### Chapter 15. Practical Ops Tips

#### 15.1 Using Includes for Clean Con gs 

**Solution**

```nginx
http {
    include config.d/compression.conf;
    include sites-enabled/*.conf
}
```



#### 15.2 Debug

You can turn on debug logging. For debug logging you’ll need to ensure that your NGINX package is configured with the -- with-debug flag. 

```nginx
error_log /var/log/nginx/error.log debug.
```



You can enable debugging for particular connections. 