// 创建副本集
replicaSet = new  ReplSetTest({"nodes": 3})

// 启动3个monogd进程
replicaSet.startSet()

// 配置复制功能
replicaSet.initiate()

// 连接主节点
conn1 = new Mongo("localhost:20000")
primaryDB = conn1.getDB("test")
primaryDB.isMaster()

// 连接备份节点
conn2 = new Mongo("localhost:20001")
secondaryDB = conn2.getDB("test")
secondaryDB.isMaster()

//  主节点写入数据
for (i = 0; i < 10; i ++) {
	primaryDB.coll.insert({"count": i})
}

primaryDB.coll.find()

secondaryDB.coll.find()
//Error: error: {
//	"ok" : 0,
//	"errmsg" : "not master and slaveOk=false",
//	"code" : 13435,
//	"codeName" : "NotMasterNoSlaveOk"
//}

conn2.setSlaveOk()
secondaryDB.coll.find()

// 备份节点写入数据
secondaryDB.coll.insert({"count":10})
// WriteResult({ "writeError" : { "code" : 10107, "errmsg" : "not master" } })


// automatic failover
primaryDB.adminCommand({"shutdown" : 1})

secondaryDB.isMaster()

// 关闭副本集
replicaSet.stopSet()
