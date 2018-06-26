

#### CSS 概述

- CSS 指层叠样式表 (*C*ascading *S*tyle *S*heets)
- 样式定义如何显示 HTML 元素
- 样式通常存储在样式表中
- 把样式添加到 HTML 4.0 中，是为了解决内容与表现分离的问题
- 外部样式表可以极大提高工作效率
- 外部样式表通常存储在 CSS 文件中
- 多个样式定义可层叠为一

**当同一个 HTML 元素被不止一个样式定义时，会使用哪个样式呢？**

一般而言，所有的样式会根据下面的规则层叠于一个新的虚拟样式表中，其中数字 4 拥有最高的优先权。

1. 浏览器缺省设置
2. 外部样式表
3. 内部样式表（位于 `<head>` 标签内部）
4. 内联样式（在 HTML 元素内部）

#### CSS 基础语法

CSS 规则由两个主要的部分构成：选择器，以及一条或多条声明。

**选择器的分组**

```css
h1,h2,h3,h4,h5,h6 {
	color: green;
}
```

**继承及其问题**

根据 CSS，子元素从父元素继承属性。但是它并不总是按此方式工作。

```css
body {
    font-family: Verdana, sans-serif;
}
```

根据上面这条规则，站点的 body 元素将使用 Verdana 字体（假如访问者的系统中存在该字体的话）。

通过 CSS 继承，子元素将继承最高级元素（在本例中是 body）所拥有的属性（这些子元素诸如 p, td, ul, ol, ul, li, dl, dt,和 dd）。不需要另外的规则，所有 body 的子元素都应该显示 Verdana 字体，子元素的子元素也一样。并且在大部分的现代浏览器中，也确实是这样的。

但是在那个浏览器大战的血腥年代里，这种情况就未必会发生，那时候对标准的支持并不是企业的优先选择。

如果你不希望 "Verdana, sans-serif" 字体被所有的子元素继承，又该怎么做呢？比方说，你希望段落的字体是 Times。没问题。创建一个针对 p 的特殊规则，这样它就会摆脱父元素的规则。



**派生选择器**

通过依据元素在其位置的上下文关系来定义样式，你可以使标记更加简洁。

```css
li strong {
    font-style: italic;
    font-weight: normal;
}
```

在上面的例子中，只有 li 元素中的 strong 元素的样式为斜体字，无需为 strong 元素定义特别的 class 或 id，代码更加简洁。

**id 选择器**

id 选择器可以为标有特定 id 的 HTML 元素指定特定的样式。id 选择器以 "#" 来定义。

```css
#sidebar p {
	font-style: italic;
	text-align: right;
	margin-top: 0.5em;
}
```



**CSS 类选择器**

在 CSS 中，类选择器以一个点号显示。

```css
.center {text-align: center}
```

和 id 一样，class 也可被用作派生选择器。

元素也可以基于它们的类而被选择：

```css
td.fancy {
    color: #f60;
    background: #666;
}
```

```html
<td class="fancy">
```

#### CSS 创建

当读到一个样式表时，浏览器会根据它来格式化 HTML 文档。插入样式表的方法有三种:

**外部样式表**

```html
<head>
<link rel="stylesheet" type="text/css" href="mystyle.css" />
</head>
```

浏览器会从文件 mystyle.css 中读到样式声明，并根据它来格式文档。

外部样式表可以在任何文本编辑器中进行编辑。文件不能包含任何的 html 标签。样式表应该以 .css 扩展名进行保存。

**内部样式表**

当单个文档需要特殊的样式时，就应该使用内部样式表。你可以使用 `<style>` 标签在文档头部定义内部样式表。

```CSS
<head>
<style type="text/css">
    hr {color: sienna;}
    p {margin-left: 20px;}
    body {background-image: url("images/back40.gif");}
</style>
</head>
```

**内联样式**

由于要将表现和内容混杂在一起，内联样式会损失掉样式表的许多优势。请慎用这种方法，例如当样式仅需要在一个元素上应用一次时。

要使用内联样式，你需要在相关的标签内使用样式（style）属性。

```html
<p style="color: sienna; margin-left: 20px">
This is a paragraph
</p>
```



多重样式

如果某些属性在不同的样式表中被同样的选择器定义，那么属性值将从更具体的样式表中被继承过来。

例如，外部样式表拥有针对 h3 选择器的三个属性：

```css
h3 {
    color: red;
    text-align: left;
    font-size: 8pt;
}
```

而内部样式表拥有针对 h3 选择器的两个属性：

```css
h3 {
	text-align: right; 
	font-size: 20pt;
}
```

假如拥有内部样式表的这个页面同时与外部样式表链接，那么 h3 得到的样式是：

```css
h3 {
	color: red; 
	text-align: right; 
	font-size: 20pt;
}
```

####  CSS 样式

**CSS 背景**

CSS 允许应用纯色作为背景，也允许使用背景图像创建相当复杂的效果。

CSS 在这方面的能力远远在 HTML 之上。

```css
/* background-color 属性为元素设置背景色。这个属性接受任何合法的颜色值。 */
p {background-color: gray;}

/* 增加一些内边距,背景色从元素中的文本向外少有延伸 */
p {background-color: gray; padding: 20px;}
```

可以为所有元素设置背景色，这包括 body 一直到 em 和 a 等行内元素。

background-color 不能继承，其默认值是 transparent。transparent 有“透明”之意。也就是说，如果一个元素没有指定背景色，那么背景就是透明的，这样其祖先元素的背景才能可见。

**背景图像**

要把图像放入背景，需要使用 background-image 属性。background-image 属性的默认值是 none，表示背景上没有放置任何图像。如果需要设置一个背景图像，必须为这个属性设置一个 URL 值：

```css
body {background-image: url(/i/eg_bg_04.gif);}
```

background-image 也不能继承。事实上，所有背景属性都不能继承。



CSS 框模型

![t](http://www.w3school.com.cn/i/ct_boxmodel.gif)



元素框的最内部分是实际的内容，直接包围内容的是内边距。内边距呈现了元素的背景。内边距的边缘是边框。边框以外是外边距，外边距默认是透明的，因此不会遮挡其后的任何元素。

提示：背景应用于由内容和内边距、边框组成的区域，margin 在背景外。

内边距、边框和外边距都是可选的，默认值是零。但是，许多元素将由用户代理样式表设置外边距和内边距。可以通过将元素的 margin 和 padding 设置为零来覆盖这些浏览器样式。这可以分别进行，也可以使用通用选择器对所有元素进行设置：

```css
* {
    margin: 0;
    padding: 0;
}
```



在 CSS 中，width 和 height 指的是内容区域的宽度和高度。增加内边距、边框和外边距不会影响内容区域的尺寸，但是会增加元素框的总尺寸。

![](http://www.w3school.com.cn/i/ct_css_boxmodel_example.gif)

提示：内边距、边框和外边距可以应用于一个元素的所有边，也可以应用于单独的边。

margin 可以是负值，而且在很多情况下都要使用负的 margin。

**CSS padding 属性**

```css
/* padding 属性接受长度值或百分比值，但不允许使用负值。 */
h1 {padding: 10px;}
/* top: 10px right: 0.25em bottom: 2ex left: 20% */
h1 {padding: 10px 0.25em 2ex 20%;}

/* 以下配置与上面等价 */
h1 {
	padding-top: 10px;
 	padding-right: 0.25em;
 	padding-bottom: 2ex;
 	padding-left: 20%;
}
```



**内边距的百分比数值**

内边距可以设置百分数值。百分数值是相对于其父元素的 width 计算的，这一点与外边距一样。所以，如果父元素的 width 改变，它们也会改变。

注意：上下内边距与左右内边距一致；即上下内边距的百分数会相对于父元素宽度设置，而不是相对于高度。

```css
<div style="width: 200px;">
	<p>This paragragh is contained within a DIV that has a width of 200 pixels.</p>
</div>
p {
    padding: 10%;
}
```



**CSS margin 属性**

margin 属性接受任何长度单位，可以是像素、英寸、毫米或 em，接受百分数值甚至负值。

margin 的默认值是 0，所以如果没有为 margin 声明一个值，就不会出现外边距。但是，在实际中，浏览器对许多元素已经提供了预定的样式，外边距也不例外。例如，在支持 CSS 的浏览器中，外边距会在每个段落元素的上面和下面生成“空行”。因此，如果没有为 p 元素声明外边距，浏览器可能会自己应用一个外边距。当然，只要你特别作了声明，就会覆盖默认样式。



**值复制**

```css
/* 有时，我们会输入一些重复的值： */
p {margin: 0.5em 1em 0.5em 1em;}
/* 上面的规则与下面的规则是等价的： */
p {margin: 0.5em 1em;}
```

这两个值可以取代前面 4 个值。这是如何做到的呢？CSS 定义了一些规则，允许为外边距指定少于 4 个值。规则如下：

- 如果缺少左外边距的值，则使用右外边距的值。

- 如果缺少下外边距的值，则使用上外边距的值。

- 如果缺少右外边距的值，则使用上外边距的值。

  ![](http://www.w3school.com.cn/i/ct_css_margin_value.gif)

换句话说，如果为外边距指定了 3 个值，则第 4 个值（即左外边距）会从第 2 个值（右外边距）复制得到。如果给定了两个值，第 4 个值会从第 2 个值复制得到，第 3 个值（下外边距）会从第 1 个值（上外边距）复制得到。最后一个情况，如果只给定一个值，那么其他 3 个外边距都由这个值（上外边距）复制得到。

#### CSS 定位机制

div、h1 或 p 元素常常被称为块级元素。这意味着这些元素显示为*一块内容*，即“块框”。与之相反，span 和 strong 等元素称为“行内元素”，这是因为它们的内容显示在行中，即“行内框”。

您可以使用 display 属性改变生成的框的类型。这意味着，通过将 display 属性设置为 block，可以让行内元素（比如 <a> 元素）表现得像块级元素一样。还可以通过把 display 设置为 none，让生成的元素根本没有框。这样的话，该框及其所有内容就不再显示，不占用文档中的空间。

 CSS 有三种基本的定位机制：

- 普通流
- 浮动
- 绝对定位