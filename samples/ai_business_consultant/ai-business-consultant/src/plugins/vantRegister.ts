import Vue from 'vue';
import { Button, Field, Picker, Popover, Popup, Search, Tag, Toast,Form, Uploader, DropdownItem, DropdownMenu, Cell, Radio, CheckboxGroup, Checkbox } from 'vant';
const vantComponents = [
  Picker,
  Field,
  Popup,
  Toast,
  Search,
  Popover,
  Button,
  Tag,
  Form,
  Uploader,
  DropdownItem,
  DropdownMenu,
  CheckboxGroup,
  Checkbox
];
export const registerVantComponents = () => {
  vantComponents.forEach((component) => Vue.use(component));
};
