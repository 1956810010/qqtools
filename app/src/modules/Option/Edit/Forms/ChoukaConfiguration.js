/* 抽卡配置 */
import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Input, Checkbox, message } from 'antd';
import style from '../style.sass';
import * as ShuoMing from '../utils/shuoming';
const path: Object = global.require('path');

class ChoukaConfiguration extends Component {
  static propTypes: Object = {
    form: PropTypes.object,
    detail: PropTypes.object
  };

  choukaJsonRef: Object = createRef();

  // 选择文件
  handleChangeJsonClick: Function = (event: Event): void => {
    this.choukaJsonRef.current.click();
  };
  // input change
  handleChangeJsonChange: Function = (event: Event): void => {
    const file: Object = event.target.files[0];
    const pp: Object = path.parse(file.path);

    if (pp.ext !== '.json') {
      message.error('文件格式错误，必须是*.json文件格式！');
    } else {
      this.props.form.setFieldsValue({
        choukaJson: file.path
      });
    }
  };
  render(): React.Node {
    const { detail, form }: { detail: ?Object, form: Object } = this.props;
    const { getFieldDecorator }: { getFieldDecorator: Function } = form;
    const colsArea3: Object = { labelCol: { span: 6 }, wrapperCol: { span: 18 } };

    const isChouka: boolean = detail?.basic?.isChouka; // 开启抽卡功能
    const isChoukaSendImage: boolean = detail?.basic?.isChoukaSendImage; // 抽卡发送图片

    return (
      <Card className={ style.mb10 } title="摩点抽卡配置">
        <Form.Item label="开启摩点抽卡功能" { ...colsArea3 }>
          {
            getFieldDecorator('isChouka', {
              initialValue: isChouka
            })(<Checkbox defaultChecked={ isChouka } />)
          }
        </Form.Item>
        <Form.Item label="发送图片" { ...colsArea3 }>
          {
            getFieldDecorator('isChoukaSendImage', {
              initialValue: isChoukaSendImage
            })(<Checkbox defaultChecked={ isChoukaSendImage } />)
          }
          <ShuoMing.IsChoukaSendImage />
        </Form.Item>
        <Form.Item label="卡牌信息文件地址" { ...colsArea3 }>
          {
            getFieldDecorator('choukaJson', {
              initialValue: detail ? detail.basic.choukaJson : ''
            })(<Input.Search enterButton="选择文件" readOnly={ true } onSearch={ this.handleChangeJsonClick } />)
          }
          <input ref={ this.choukaJsonRef }
            className={ style.disNone }
            type="file"
            accept=".json"
            onChange={ this.handleChangeJsonChange }
          />
        </Form.Item>
        <Form.Item label="允许补卡的QQ号" { ...colsArea3 }>
          {
            getFieldDecorator('bukaQQNumber', {
              initialValue: detail ? detail.basic.bukaQQNumber : ''
            })(<Input.TextArea className={ style.template } rows={ 5 } />)
          }
          <ShuoMing.BukaQQNumber />
        </Form.Item>
      </Card>
    );
  }
}

export default ChoukaConfiguration;