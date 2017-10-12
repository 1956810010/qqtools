// @flow
/* 网页版QQ登录接口 */
import { request, hash33, hash, cookieObj2Str, msgId } from './function';
const queryString = node_require('querystring');

class SmartQQ{
  cookie: Object;
  cookieStr: ?string;
  token: ?string;
  url: ?string;
  name: ?string;
  ptwebqq: ?string;
  vfwebqq: ?string;
  uin: ?string;
  cip: ?string;
  psessionid: ?string;
  friends: ?Array;
  gnamelist: ?Array;
  groupname: string;
  groupItem: ?Object;
  loginBrokenLineReconnection: ?number;
  listenMessageTimer: ?number;
  callback: Function;
  constructor(groupname: string, callback: Function): void{
    this.cookie = {};            // 储存cookie
    this.cookieStr = null;       // cookie字符串
    this.token = null;           // 二维码登录令牌
    this.url = null;             // 登录的url
    this.name = null;            // 登录的用户名
    this.ptwebqq = null;
    this.vfwebqq = null;
    this.uin = null;
    this.cip = null;
    this.psessionid = null;
    this.friends = null;         // 获取在线好友列表
    this.gnamelist = null;       // 群列表
    this.groupname = groupname;  // 群名称
    this.groupItem = null;       // 群信息
    this.loginBrokenLineReconnection = null;  // 重新登录的定时器
    this.listenMessageTimer = null;           // 轮询信息
    this.callback = callback;    // 获得信息后的回调
  }
  // 下载二维码
  downloadPtqr(): Promise{
    return request({
      reqUrl: `https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=${ new Date().getTime() }`
    });
  }
  // 计算令牌
  getToken(): void{
    const qrsig: string = this.cookie['qrsig'];
    this.token = hash33(qrsig);
  }
  // 判断是否在登录状态
  isLogin(): Promise{
    return request({
      reqUrl: `https://ssl.ptlogin2.qq.com/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-2105&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10220&login_sig=&pt_randsalt=0&ptqrtoken=${ this.token }`,
      headers: {
        'Cookie': cookieObj2Str(this.cookie)
      },
      setEncode: 'utf8'
    })
  }
  // 登录
  login():Promise{
    return request({
      reqUrl: this.url,
      headers: {
        'Cookie': cookieObj2Str(this.cookie)
      },
      setEncode: 'utf8'
    });
    // login之后的两个302重定向页面
    // http://w.qq.com/proxy.html?login2qq=1&webqq_type=10
    // http://web2.qq.com/web2_cookie_proxy.html
  }
  login302proxy(){
    return request({
      reqUrl: `http://w.qq.com/proxy.html?login2qq=1&webqq_type=10`,
      headers: {
        'Cookie': cookieObj2Str(this.cookie)
      },
      setEncode: 'utf8'
    });
  }
  login302web2(){
    return request({
      reqUrl: `http://web2.qq.com/web2_cookie_proxy.html`,
      headers: {
        'Cookie': cookieObj2Str(this.cookie)
      },
      setEncode: 'utf8'
    });
  }
  // 获取vfwebqq
  getVfWebQQ(){
    const u: string = `http://s.web2.qq.com/api/getvfwebqq?clientid=53999199&psessionid=&t=${ Math.random() * 10 ** 16 }&ptwebqq=${ this.cookie.ptwebqq }`;
    return request({
      reqUrl: u,
      headers: {
        'Cookie': cookieObj2Str(this.cookie),
        'Referer': 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1'
      },
      setEncode: 'utf8'
    });
  }
  // 获取psessionid、uin和cip
  getPsessionAndUinAndCip(): Promise{
    const data: string = queryString.stringify({
      r: JSON.stringify({
        ptwebqq: this.ptwebqq,
        clientid: 53999199,
        psessionid: '',
        status: 'online'
      })
    });
    return request({
      reqUrl: `http://d1.web2.qq.com/channel/login2`,
      headers: {
        'Cookie': cookieObj2Str(this.cookie),
        'Referer': 'http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2'
      },
      method: 'POST',
      setEncode: 'utf8',
      data
    });
  }
  // 获取群组
  getGroup(): Promise{
    const data: string = queryString.stringify({
      r: JSON.stringify({
        vfwebqq: `${ this.vfwebqq }`,
        hash: hash(this.uin, this.ptwebqq)
      })
    });
    return request({
      reqUrl: `https://s.web2.qq.com/api/get_group_name_list_mask2`,
      headers: {
        'Cookie': cookieObj2Str(this.cookie),
        'Referer': 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      setEncode: 'utf8',
      data
    });
  }
  // 获取群好友
  getFriends(): Promise{
    return request({
      reqUrl: `http://d1.web2.qq.com/channel/get_online_buddies2?vfwebqq=${ this.vfwebqq }&clientid=53999199` +
              `&psessionid=${ this.psessionid }&t=${ new Date().getTime() }`,
      headers: {
        'Cookie': cookieObj2Str(this.cookie),
        'Referer': 'http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2'
      },
      setEncode: 'utf8'
    });
  }
  // 获取群详细信息
  getGroupItem(): void{
    for(const index: number in this.gnamelist){
      const item: Object = this.gnamelist[index];
      if(item['name'] === this.groupname){
        this.groupItem = item;
        break;
      }
    }
  }
  // 将cookie转换成字符串
  cookie2Str(): void{
    this.cookieStr = cookieObj2Str(this.cookie);
  }
  // 验证成功后的一系列执行事件
  async loginSuccess(cb: Function): void{
    // 登录
    const [data1, cookies1]: [string, Object] = await this.login();
    this.cookie = Object.assign(this.cookie, cookies1);
    await this.login302proxy();
    await this.login302web2();
    // 获得vfwebqq
    const [data2]: [string] = await this.getVfWebQQ();
    this.vfwebqq = JSON.parse(data2).result.vfwebqq;
    // 获取psessionid、uin和cip
    const [data3]: [string] = await this.getPsessionAndUinAndCip();
    const { result }: { result: Object } = JSON.parse(data3);
    this.psessionid = result.psessionid;
    this.uin = result.uin;
    this.cip = result.cip;
    // 获取群组
    const [data4]: [string] = await this.getGroup();
    this.gnamelist = JSON.parse(data4).result.gnamelist;
    // 获取在线好友列表
    const [data5]: [string] = await this.getFriends();
    this.friends = JSON.parse(data5).result;
    // 获取群信息，转换cookie
    this.getGroupItem();
    this.cookie2Str();
    // 回调函数
    if(cb) cb();
  }
  // 获取消息
  getMessage(): Promise{
    const data: string = queryString.stringify({
      r: JSON.stringify({
        ptwebqq: this.ptwebqq,
        clientid: 53999199,
        psessionid: this.psessionid,
        key: ''
      })
    });
    return request({
      reqUrl: `https://d1.web2.qq.com/channel/poll2`,
      headers: {
        'Cookie': this.cookieStr,
        'Referer': 'https://d1.web2.qq.com/cfproxy.html?v=20151105001&callback=1',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': 'd1.web2.qq.com',
        'Origin': 'https://d1.web2.qq.com'
      },
      method: 'POST',
      setEncode: 'utf8',
      data
    });
  }
  // 发送消息
  sendMessage(message: string): Promise{
    const data: string = queryString.stringify({
      r: JSON.stringify({
        group_uin: this.groupItem.gid,
        content: JSON.stringify([
          message,
          [
            'font',
            {
              name: '宋体',
              size: 10,
              style: [0, 0, 0],
              color: '000000'
            }
          ]
        ]),
        face: 333,
        clientid: 53999199,
        msg_id: msgId(),
        psessionid: this.psessionid
      })
    });
    return request({
      reqUrl: `https://d1.web2.qq.com/channel/send_qun_msg2`,
      headers: {
        'Cookie': this.cookieStr,
        'Referer': 'https://d1.web2.qq.com/cfproxy.html?v=20151105001&callback=1',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      setEncode: 'utf8',
      data
    });
  }
  // 轮询事件
  async listenMessage(){
    try{
      const [data]: [string] = await this.getMessage();
      this.callback(JSON.parse(data), this);
    }catch(err){
      console.error('轮询', err);
    }
    this.listenMessageTimer = setTimeout(this.listenMessage.bind(this), 500);
  }
}

export default SmartQQ;