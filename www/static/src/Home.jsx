import {PureComponent} from 'react';
import {
  Button,
  Card,
  Icon,
  Avatar,
  List,
  Popconfirm,
  Dropdown,
  Menu
} from 'antd';
import {Link} from 'react-router-dom';
import Ellipsis from 'ant-design-pro/lib/Ellipsis';
import AddOrEditModal from './components/AddOrEditProductModal';
import UserModal from './components/AddOrEditUserModal';
import rq from './components/request';

const { Meta } = Card;

export default class extends PureComponent {
  state = this.initState();

  componentWillMount() {
    this.getList();
  }

  initState() {
    return {
      loading: false,
      list: [
        // {
        //   id: 1,
        //   avatar: 'https://p0.ssl.qhimgs4.com/t013198fa0cca90c0f6.png',
        //   title: '快资讯',
        //   description: '信息流 SDK 客户端接口文档，主要是以 console.log() 交互为主。信息流 SDK 客户端接口文档，主要是以 console.log() 交互为主。信息流 SDK 客户端接口文档，主要是以 console.log() 交互为主。'
        // }
      ],
      addOrEditModal: {
        visible: false,
        edit: false,
        model: {}
      },
      userModal: {
        visible: false,
        mdoel: {
          users: []
        }
      }
    };
  }

  async getList() {
    const resp = await rq.get('/api/doc');
    if (!Array.isArray(resp.data)) {
      return;
    }

    this.setState({list: resp.data.map(item => ({id: item._id, ...item.data}))});
  }

  showAddModal = () => {
    this.setState({addOrEditModal: {
      visible: true,
      edit: false,
      model: {}
    }});
  }

  showUserModal = async(id) => {
    const resp = await rq.get(`/api/doc/${id}/user`);
    const users = resp.data;
    this.setState({
      userModal: {
        visible: true,
        model: {
          id,
          users
        }
      }
    });
  }

  handleCancel = () => {
    this.setState({addOrEditModal: {
      visible: false,
      edit: false,
      model: {}
    }});
  }

  handleUserModalCancel = () => {
    this.setState({
      userModal: {
        visible: false,
        model: {
          users: []
        }
      }
    });
  }

  handleOk = () => {
    const form = this.formRef.props.form;
    form.validateFields(async(err, values) => {
      if (err) {
        return;
      }

      const {model} = this.state.addOrEditModal;
      let resp;
      if (model.id) {
        resp = await rq.put(`/api/doc/${model.id}`, {data: {...model, ...values}});
      } else {
        resp = await rq.post('/api/doc', {data: values});
      }
      if (resp.errno) {
        return;
      }

      this.getList();

      form.resetFields();
      this.handleCancel();
    });
  }

  handleUserModalOk = () => {
    const form = this.userFormRef.props.form;
    form.validateFields(async(err, values) => {
      if (err) {
        return null;
      }

      const users = values.users.map(user => user.key);
      const {model} = this.state.userModal;
      const resp = await rq.put(`/api/doc/${model.id}/user`, {
        user_ids: users.join()
      });

      this.getList();
      form.resetFields();
      this.handleUserModalCancel();
    });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  edit = product => {
    this.setState({addOrEditModal: {
      visible: true, edit: true, model: product
    }});
  }

  del = async product => {
    const resp = await rq.delete(`/api/doc/${product.id}`);
    if (resp.errno) {
      return;
    }

    this.getList();
  }

  render() {
    const {loading, list} = this.state;
    return (
      <div style={{ background: '#fff', padding: 24, minHeight: 'calc(100vh - 163px)' }}>
        <List
          rowKey="id"
          loading={loading}
          grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
          dataSource={[...list, '']}
          renderItem={item =>
            item ? (
              <List.Item key={item.id}>
                <Card
                  hoverable
                  actions={[
                    <a href={'/index/doc?id=' + item.id}>
                      <Icon type="eye" /> 查看
                    </a>,
                    <Link to={{pathname: `/mock/${item.id}`}}>
                      <Icon type="setting" /> 设置
                    </Link>,
                    <Dropdown overlay={<Menu>
                      <Menu.Item key="edit">
                        <span onClick={() => this.edit(item)}>
                          <Icon type="edit"/> 编辑信息
                        </span>
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item key="member">
                        <span onClick={() => this.showUserModal(item.id)}>
                          <Icon type="user"/> 成员管理
                        </span>
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item key="delete">
                        <Popconfirm
                          title="确认删除？"
                          onConfirm={() => this.del(item)}
                        ><Icon type="delete"/> 删除产品
                        </Popconfirm>
                      </Menu.Item>
                    </Menu>}>
                      <span><Icon type="ellipsis" /> 更多</span>
                    </Dropdown>
                  ]}
                >
                  <Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={<Link to={{pathname: `/d/${item.id}`}}>{item.title}</Link>}
                    description={
                      <Ellipsis tooltip className="ellipsis" lines={3}>
                        {item.description}
                      </Ellipsis>
                    }
                  />
                </Card>
              </List.Item>
            ) : (
              <List.Item>
                <Button type="dashed" className="newButton" onClick={this.showAddModal}>
                  <Icon type="plus" /> 新增产品
                </Button>
              </List.Item>
            )
          }
        />

        <AddOrEditModal
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.addOrEditModal.visible}
          onCancel={this.handleCancel}
          onOk={this.handleOk}
          isEdit={this.state.addOrEditModal.edit}
          model={this.state.addOrEditModal.model}
        />
        <UserModal
          wrappedComponentRef={formRef => this.userFormRef = formRef}
          visible={this.state.userModal.visible}
          onCancel={this.handleUserModalCancel}
          onOk={this.handleUserModalOk}
          model={this.state.userModal.model}
        />
      </div>
    );
  }
}
