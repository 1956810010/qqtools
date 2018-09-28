import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import Routers from './router/Routers';
import { LocaleProvider } from 'antd';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import { storeFactory } from './store/store';
import './common.sass';

/* app */
ReactDOM.render(
  <Provider store={ storeFactory(window.__INITIAL_STATE__ || {}) }>
    <LocaleProvider locale={ zhCN }>
      <HashRouter>
        <Routers />
      </HashRouter>
    </LocaleProvider>
  </Provider>,
  document.getElementById('app')
);