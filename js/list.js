class List {
  constructor() {
    layer.open({
      title: '添加商品成功'
      , content: '去购物车查看商品吧??'
      , btn: ['留在当前', '去购物车']
      , btn2: function (index, layero) {
        console.log('购物车出发');
      }
    });
    this.getData();
    this.binddd();
    //默认页码  第一页数据
    this.currentPage = 1;
    //使用锁  节流防抖
    this.lock = false;
  }
  // 绑定事件的方法
  binddd() {
    // 给 ul 绑定点击事件
    // this.addCart 是ul的事件回调方法,故内部this默认指向当前节点
    this.$('.sk_bd ul').addEventListener('click', this.checkLogin.bind(this))

    //懒加载的滚动条事件
    window.addEventListener('scroll', this.lazy)
  }

  // /获取数据
  async getData(page = 1) {
    //输出1122
    // console.log(1122);
    //发送ajax请求获取数据
    // async   await结合使用 
    //http://localhost:8888/goods/list地址
    let { status, data } = await axios.get('http://localhost:8888/goods/list?current=' + page);
    // console.log(goodsData);
    // console.log(status, data);

    // 判断请求的状态是否成功
    // status 是ajax 服务器请求成功
    // data.code 接口返回数据正常
    if (status != 200 && data.code != 1) throw new Error('获取失败');

    // 循环渲染数据,追加到页面中

    let html = '';
    data.list.forEach(goods => {
      // console.log(goods);
      html += `<li class="sk_goods" data-id="${goods.goods_id}">
      <a href="#none">
          <img src="${goods.img_big_logo}" alt="">
      </a>
      <h5 class="sk_goods_title">${goods.title}</h5>
      <p class="sk_goods_price">
          <em>¥${goods.current_price}</em>
          <del>￥${goods.price}</del>
      </p>
      <div class="sk_goods_progress">
          已售
          <i>${goods.sale_type}</i>
          <div class="bar">
              <div class="bar_in"></div>
          </div>
          剩余
          <em>29</em>件
      </div>
      <a href="#none" class="sk_goods_buy">立即抢购</a>
  </li>`;
    });

    // console.log(html);
    // 将拼接好的字符串,追加ul中
    // console.log(this.$('.sk_bd ul'));
    this.$('.sk_bd ul').innerHTML += html;
  }
  // /加入购物车
  checkLogin(eve) {
    // console.log(this);
    // 获取事件源,判断点击的是否为a标签
    // console.log(eve.target.classList);
    if (eve.target.nodeName != 'A' || eve.target.className != 'sk_goods_buy') return;
    // console.log(eve.target);

    // 判断用户是否登录,如果local中有token,表示登录,没有则表示未登录
    let token = localStorage.getItem('token');
    // console.log(token);
    // 没有token表示未登录,跳转到登录页面
    if (!token) location.assign('./login.html?ReturnUrl=./list.html')

    //如果用户登录   此时就需要将商品加入购物车
    //获取商品id和用户id
    //商品id
    let goodsId = eve.target.parentNode.dataset.id;
    // console.log(goodsId);
    //用户id
    let userId = localStorage.getItem('user_id');
    console.log(userId);

    this.addCartGoods(goodsId, userId);

  }

  addCartGoods(gId, uId) {
    console.log(gId, uId);
    //给添加购物车接口发送请求
    //常量的地方都大写
    //给属性以[]形式给
    //headers本质是个对象
    //  headers['Content-Type'] 也是给 headers 对象中添加属性,只是.语法不支持 Content-Type

    const AUTH_TOKEN = localStorage.getItem('token')
    axios.defaults.headers.common['authorization'] = AUTH_TOKEN;
    //  axios.defaults.headers.common.authorization = AUTH_TOKEN
    //     headers['Content-Type']  也是 给 headers 对象中添加属性,只是. 语法不支持 Content-Type
    axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    // axios.defaults.headers.Content-Type='application/x-www-form-urlencoded'
    let param = `id=${uId}&goodsId=${gId}`;
    axios.post(' http://localhost:8888/cart/add', param).then(({ data, status }) => {
      // console.log(data, status);
      // 判断添加购物车是否成功
      if (status == 200 && data.code == 1) {
        layer.open({
          title: '商品添加成功'
          , content: '大爷，进购物车看看吗?'
          , btn: ['留下', '去吧']
          , btn2: function (index, layero) {
            // console.log('去购物车了...');
            location.assign('./cart.html')

          }
        });
      } else if (status == 200 && data.code == 401) {  // 如果登录过期,则重新登录
        // 清除 local中存的token和userid
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        // 跳转到登录页面
        location.assign('./login.html?ReturnUrl=./list.html')
      } else {
        layer.open({
          title: '失败提示框...'
          , content: '商品添加失败'
          , time: 3000
        }
        );
      }


    })

  }


  //懒加载
  //当前需要的内容高度等于==滚动条距离顶部的高度+可视区的高度
  //需要获取新的数据   当前数据(实际内容)的高度<滚动条距离顶部的高度+可视区的高度

  lazy = () => {
    //滚动条高度
    let top = document.documentElement.scrollTop;
    // console.log(top,'tt');
    //可视区高度142
    let cliH = document.documentElement.clientHeight;
    // console.log(cliH,'cccc');
    //实际内容高度  (1360是内容的高度   不包含头部)
    let conH = this.$('.sk_container').offsetHeight;
    // console.log(conH,'hhhh');
    //判断  当滚动条的高度加上可视区的高度大于实际内容高度是 就加载新内容
    //450是头部的高度
    if (top + cliH > (conH + 450)) {
      //满足条件会不停触发数据加载     ,使用节流防抖
      //如果锁的状态   结束执行代码
      if (this.lock) return;
      this.lock = true;

      //指定时间开锁
      setTimeout(() => {
        this.lock = false;

      }, 1000)


      // console.log(2222);//到底部时加载新数据出现222
      this.getData(++this.currentPage)
    }

  }






  // 封装获取节点的方法
  $(ele) {
    let res = document.querySelectorAll(ele);
    // 如果获取到的是,当个节点集合,就返回单个节点,如果是多个节点集合,就返回整个集合.
    return res.length == 1 ? res[0] : res;
  }
}

new List;