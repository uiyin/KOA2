const Koa = require('koa')
const app = new Koa()
// 加载路由开始,注意koarouter返回的是一个函数
const router = require('koa-router')()
// 加载koa-bodyparser
const bodyParser = require('koa-bodyparser')
// 加载文件模块
const fs = require('fs')
// 加载路径模块
const path = require('path')
// 加载静态文件模块
const staticAll = require('koa-static')
// 加载允许跨域模块这个模块加载了就保证允许跨域了
var cors = require('koa2-cors')
// 输出的时候就是json包
var json = require('koa-json')
// 加载session模块
const session = require('koa-session')
// 静态资源目录对于相对入口文件app.js的路径
const staticPath = './static'
//把上面引入的都挂载到全局
app.use(json())
app.use(cors())
app.use(staticAll(path.join(__dirname, './public/uploads')))
app.use(staticAll(path.join(__dirname, staticPath)))

app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())
//get下面输出html文件 要是文件渲染用别的
router.get('/', async (ctx, next) => {
	ctx.response.type = 'html'
	ctx.response.body = fs.createReadStream('./pages/index/index.html')
	//他后面要是有代码的话，他先执行后面的异步操作。等后面的异步操作完事了。他在由后向前推动执行
	await next()
})
// get下面获取参数类似 ?id=1&name=zhangsan之类的
router.get('/get', async (ctx, next) => {
	let value = ctx.request.query
	ctx.body = value
	await next()
})
// get 下面动态路由设置
router.get('/:username/:id', async (ctx, next) => {
	let value = ctx.params
	ctx.body = value
	await next()
})
// get请求下输出文件属性
var sellerdata = require('./static/data.json')
router.get('/goods', (ctx) => {
	ctx.body = {
		status: 200,
		data: sellerdata.goods
	}
})
// POST获取到数据不包含图片上传
router.post('/login', async (ctx, next) => {
	let value = ctx.request.body // 获取到前端发送的数据
	ctx.body = value
	await next()
})
/*--------------------------cookie模块--------------------------*/
// koa2 服务器端 设置cookie
router.get('/cookie', (ctx) => {
	// set cookie 第一表示属性，第二个表示值 第三个表示状态
	ctx.cookies.set(
		'cid', 'helloworld', {
			domain: '127.0.0.1', // 写cookie所在的域名,域名必须对的上
			path: '/', // 写cookie所在的路径
			maxAge: 2 * 60 * 60 * 1000, // cookie有效时长(2小时)
			expires: new Date('2019-02-08'), // cookie失效时间
			httpOnly: false, // 是否只用于http请求中获取
			overwrite: false // 是否允许重写
		}
	)
	ctx.body = 'cookie设置成功'
})
//koa2 服务器端获取cookie
router.get('/getcookie', (ctx) => {
	let value = ctx.cookies.get('cid')
	console.log(value)
	ctx.body = value
})
// koa2 服务器删除cookie
router.get('/delcookie', (ctx, next) => {
	ctx.body = '删除成功'
	ctx.cookies.set('cid', '', {
		maxAge: 0
	})
	next()
})
/*-------------------------------------cookie模块结束--------------------------------*/
/*-----------------------------------session模块开始---------------------------------*/
app.keys = ['some secret hurr']
//实现session的方法有多种，koa-serssion是将session加密保存在cookie中，浏览器与服务器交互，可以通过看cookie里是否有session来判断用户是否登录。
const CONFIG = {
	key: 'koa:sess',
	/** 默认 */
	maxAge: 1000 * 60 * 60 * 24, // 消失时间变成1天
	autoCommit: true,
	/** (boolean) automatically commit headers (default true) */
	overwrite: true,
	/** (boolean) can overwrite or not (default true) */
	httpOnly: true,
	/** (boolean) httpOnly or not (default true) */
	signed: true,
	/** (boolean) signed or not (default true) */
	rolling: false,
	/** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
	renew: false,
	/** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
}

app.use(session(CONFIG, app))
router.get('/setsession', async (ctx, next) => {
	ctx.session.token = 'xxxxxx'
	await next()
})
router.get('/getsession', async (ctx, next) => {
	let value = ctx.session.token
	ctx.body = value
	await next()
})



/*--------------------------------------session模块结束-------------------------------------*/
/*-------------------------------------文件上传模块开始-------------------------------------*/
const multer = require('koa-multer')
//配置    
var storage = multer.diskStorage({
	//定义文件保存路径
	destination: function (req, file, cb) {
		cb(null, './public/uploads/') //路径根据具体而定。如果不存在的话会自动创建一个路径
	},
	//修改文件名
	filename: function (req, file, cb) {
		var fileFormat = (file.originalname).split('.')
		cb(null, Date.now() + '.' + fileFormat[fileFormat.length - 1])
	}
})
//加载配置
const upload = multer({
	storage
})


router.get('/shangchuan', async (ctx, next) => {
	ctx.response.type = 'html'
	ctx.response.body = fs.createReadStream('./pages/upload/upload.html')
	//他后面要是有代码的话，他先执行后面的异步操作。等后面的异步操作完事了。他在由后向前推动执行
	await next()
})
router.post('/upload', upload.single('file'), async (ctx, next) => {
	console.log(ctx.req.body)
	ctx.body = {
		filename: ctx.req.file.filename, //返回文件名 
	}
	await next()
})
/*------------------------------------------文件上传模块结束---------------------------------------------------*/
/*--------------------------------------------------------数据库模块开始----------------------------------------------*/
let query = require('./mysql/mysql.js')
async function selectAllData() {
	let sql = 'SELECT * FROM admin'
	let result = await query(sql)
	return result
}
router.get('/select', async (ctx) => {
	let result = await selectAllData()
	ctx.body = result

})

/*----------------------------------------------------------数据库模块结束-----------------------------------------*/

// 路由找不到啊的情况,这个卸载路由最后这样不会优先匹配
app.use(async (ctx, next) => {
	if (ctx.request.response.status === 404) {
		let value = '对不起没有这个页面'
		ctx.body = value
		console.log(ctx.request.path + ':' + ctx.request.method)
		await next()
	}
})

app.listen(3000, () => {
	console.log('服务启动了')
})