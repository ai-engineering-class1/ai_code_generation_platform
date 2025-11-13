import Vue from 'vue'
import {
    Upload,
    Dialog,
    Table,
    Switch,
    Button,
    TableColumn,
    Select,
    Option,
    Checkbox,
    CheckboxGroup,
    Container,
    Aside,
    Main,
    Input,
    Divider,
    Drawer,
    Form,
    FormItem,
    Tabs,
    TabPane,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Progress,
    Tooltip,
    Popover,
    Image,
    Cascader,
    InputNumber,
    DatePicker,
    Alert

} from 'element-ui'


const elementUIComponents = [
    Upload,
    Dialog,
    Table,
    Switch,
    Button,
    TableColumn,
    Select,
    Option,
    Checkbox,
    CheckboxGroup,
    Container,
    Aside,
    Main,
    Input,
    Divider,
    Drawer,
    Form,
    FormItem,
    Tabs,
    TabPane,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Progress,
    Tooltip,
    Popover,
    Image,
    Cascader,
    InputNumber,
    DatePicker,
    Alert
]

export const registerElementUIComponents = () => {
    // eslint-disable-next-line
    elementUIComponents.forEach((c: any) => Vue.component(c.name, c))
}
