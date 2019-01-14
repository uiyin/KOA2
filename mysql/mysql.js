let pool = require('./mysqlconfig.js')
let query = function (sql, values) {
	return new Promise((resolve, reject) => {
		pool.getConnection(function (err, connection) {
			if (err) {
				reject(err)
			} else {
				console.log('连接成功')
				connection.query(sql, values, (err, rows) => {
					if (err) {
						reject(err)
					} else {
						console.log('有结果了')
						resolve(rows)
					}
					connection.release()
				})
			}
		})
	})
}
module.exports = query