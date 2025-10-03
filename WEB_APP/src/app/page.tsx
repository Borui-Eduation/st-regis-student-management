export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎓 St Regis 选课系统
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            支持 1000-2000 并发注册的高性能在线选课平台
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">高并发</h3>
              <p className="text-sm text-gray-600">支持 1000-2000 并发注册</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-semibold text-gray-900 mb-2">自动化</h3>
              <p className="text-sm text-gray-600">审批、开课、通知全自动</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-semibold text-gray-900 mb-2">实时通知</h3>
              <p className="text-sm text-gray-600">邮件自动发送</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📡 可用的 API 端点</h2>
            <div className="text-left space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs">GET</span>
                <code className="text-gray-700">/api/courses</code>
                <span className="text-gray-500">- 获取课程列表</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">POST</span>
                <code className="text-gray-700">/api/enroll/submit</code>
                <span className="text-gray-500">- 提交注册（高并发）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">POST</span>
                <code className="text-gray-700">/api/admin/approve</code>
                <span className="text-gray-500">- 管理员审批</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">POST</span>
                <code className="text-gray-700">/api/it/open-course</code>
                <span className="text-gray-500">- IT 开课</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center">
            <a 
              href="/student" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-semibold"
            >
              🎓 学生选课
            </a>
            <a 
              href="/admin" 
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-semibold"
            >
              👨‍💼 管理员审批
            </a>
            <a 
              href="/it" 
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-semibold"
            >
              💻 IT 开课
            </a>
          </div>
          
          <div className="mt-4 text-center">
            <a 
              href="/api/courses" 
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              或直接测试 API 端点 →
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ✅ 系统运行正常 | 🔥 Cloud Functions 已配置 | 📊 Firestore 已连接
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

