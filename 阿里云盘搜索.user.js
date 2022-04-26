// ==UserScript==
// @name         阿里云盘搜索
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在阿里云盘（web端）集成一个资源搜索引擎
// @author       tutu辣么可爱
// @match        *://*.aliyundrive.com/drive*
// @license      MIT License
// ==/UserScript==

(function() {
	function $ele(dom, dom2 = document) {
		switch (dom.slice(0, 1)) {
			case "<":
				dom2 = document.createElement("div");
				dom2.innerHTML = dom;
				dom2 = dom2.childNodes;
				break;
			default:
				dom2 = dom2.querySelectorAll(dom);
				break;
		}
		return dom2.length > 1 ? dom2 : dom2[0]
	}

	function $eleFn(dom, dom2 = document) {
		return {
			data: [dom, dom2],
			listen: function(callback, interval = 500) {
				var that = this;
				return setInterval(() => {
					if ($ele(that.data[0], that.data[1])) {
						callback();
					}
				}, interval)
			},
			ready: function(callback, timeout = 3000) {
				var timer = this.listen(() => {
					clearInterval(timer);
					callback();
				})
				setTimeout(() => {
					clearInterval(timer);
				}, timeout)
				return timer
			}
		}
	}
	HTMLElement.prototype.attr = function(key, val) {
		if (typeof key === "string") {
			if (/string|boolean/.test(typeof val)) {
				if (!val && val !== false) {
					this.removeAttribute(key);
				} else {
					this.setAttribute(key, val);
				}
				return this;
			} else {
				return this.getAttribute(key);
			}
		}
	}
	HTMLElement.prototype.css = function(key, val) {
		if (typeof key === "string") {
			if (/string|boolean/.test(typeof val)) {
				this.style.setProperty(key, val);
			} else if (!val) {
				return getComputedStyle(this)[key];
			}
		} else {
			for (let i in key) {
				this.style.setProperty(i, key[i]);
			}
		}
		if (this.style === "") {
			this.attr("style", "")
		}
		return this;
	}
	HTMLElement.prototype.hide = function() {
		this.setAttribute("display_backup", this.css("display"));
		this.css("display", "none")
		return this;
	}
	HTMLElement.prototype.show = function() {
		var backup = this.attr("display_backup") ? this.attr("display_backup") : "";
		this.css("display", backup !== "none" ? backup : "");
		return this;
	}
	HTMLElement.prototype.insert = function(dom, position = "end") {
		dom = typeof dom === "string" ? $ele(dom) : (Array.isArray(dom) ? dom : [dom]);
		switch (position) {
			case "start":
				Array.from(dom).reverse().forEach((e, i) => {
					this.insertBefore(e, this.firstChild);
				})
				break;
			case "end":
				dom.forEach((e, i) => {
					this.append(e);
				})
				break;
			case "before":
				Array.from(dom).reverse().forEach((e, i) => {
					this.parentElement.insertBefore(e, this);
				})
				break;
			case "after":
				if (this.parentElement.lastChild === this) {
					dom.forEach((e, i) => {
						this.append(e);
					})
				} else {
					let next = this.nextSilbing;
					Array.from(dom).reverse().forEach((e, i) => {
						this.parentElement.insertBefore(e, next);
					})
				}
				break;
		}
		return this;
	}
	HTMLElement.prototype.replace = function(dom) {
		dom = this.insert(dom, "before");
		this.remove();
		return dom;
	}
	NodeList.prototype.hide = function() {
		this.forEach((e, i) => {
			e.hide();
		})
	}
	NodeList.prototype.show = function() {
		this.forEach((e, i) => {
			e.show();
		})
	}

	var searchBase = {
		"UP云搜": `https://www.upyunso.com/search.html?keyword={k}`,
		"喵狸盘搜": `https://www.alipansou.com/search?k={k}`,
		"大盘搜": `https://aliyunso.cn/search?keyword={k}`,
		"盘友社区": `https://www.panyoubbs.com/search.html?q={k}`,
		"阿里云盘搜": `https://aliyunpanso.cn/?type=forum&s={k}`,
		"云盘资源导航": `https://aliyun.panpanr.com`
	}
	var box = $ele(`<div id="aliyunpan-searchTool" class="aliyunpan-searchTool-box"></div>`).css({
		"position": "fixed",
		"width": "100vw",
		"height": "60vh",
		"top": "0",
		"left": "0",
		"right": "0",
		"margin": "auto",
		"background": "transparent",
		"display": "none"
	})
	box.onclick = function(evt) {
		if (evt.target.id === "aliyunpan-searchTool") {
			$ele("#aliyunpan-searchTool").hide();
		}
	}
	var panel = $ele(`<div class="aliyunpan-searchTool-panel"></div>`).css({
		"border-radius": "10px",
		"background": "var(--background_tertiary)",
		"color": "var(--context_primary)",
		"font-size": "14px",
		"line-height": "1.5",
		"font-weight": "500",
		"width": "620px",
		"height": "76px",
		"max-width": "80vw",
		"max-height": "80vh",
		"position": "absolute",
		"left": "0",
		"right": "0",
		"top": "0",
		"bottom": "0",
		"margin": "auto"
	})
	var bar = $ele(`<div class="aliyunpan-searchTool-bar"></div>`).css({
		"width": "calc(100% - 2em)",
		"height": "2em",
		"position": "absolute",
		"left": "0",
		"right": "0",
		"top": "0",
		"bottom": "0",
		"margin": "auto"
	});
	var select = `<select>`;
	for (let i in searchBase) {
		select += `<option>${i}</option>`;
	}
	select += `</select>`;
	select = $ele(select).css({
		"background": "var(--background_tertiary)",
		"font-size": "14px",
		"line-height": "1.5",
		"font-weight": "500",
		"width": "8em",
		"height": "100%",
		"border": "0",
		"outline": "0",
		"text-align": "center",
		"cursor": "pointer"
	})
	var input = $ele(`<input type="text" placeholder="搜索内容"/>`).css({
		"background": "var(--background_tertiary)",
		"font-size": "14px",
		"line-height": "1.5",
		"font-weight": "500",
		"width": "calc(100% - 12em)",
		"height": "100%",
		"border": "0",
		"outline": "0",
		"padding": "0 1.2em"
	})
	input.onkeyup = function(evt) {
		if (this.value) {
			button.innerText = "搜索";
		} else {
			button.innerText = "关闭";
		}
		if (evt.key === "Enter") {
			button.click();
		}
	};
	var button = $ele(`<button>关闭</button>`).css({
		"background": "var(--background_tertiary)",
		"font-size": "14px",
		"line-height": "1.5",
		"font-weight": "500",
		"width": "4em",
		"height": "100%",
		"border": "0",
		"text-align": "center",
		"cursor": "pointer"
	})
	button.onclick = function() {
		if (this.innerText === "关闭") {
			box.click();
		} else {
			var url = searchBase[$ele("#aliyunpan-searchTool select").value];
			url = url.replace("{k}", $ele("#aliyunpan-searchTool input").value);
			console.log(url);
			open(url);
		}
	}
	$ele("body").insert(box.insert(panel.insert(bar.insert([select, input, button])))).onkeyup = function(evt) {
		if (!/input|textarea/i.test(evt.target.tagName) && evt.shiftKey && /f/i.test(evt.key)) {
			var ele=$ele("#aliyunpan-searchTool");
			ele.css("display")==="none"?ele.show():ele.hide();
		}
	};
	$eleFn("ul.nav-menu--1wQUw li").ready(() => {
		var btn = $ele("ul.nav-menu--1wQUw li")[0].cloneNode(true).attr("class", "nav-menu-item--2oDIG");
		$ele("use", btn).setAttribute("xlink:href", "#PDSSearch");
		$ele("ul.nav-menu--1wQUw").insert(btn);
		btn.children[1].innerText = "资源搜索";
		btn.onclick = function() {
			$ele("#aliyunpan-searchTool").show();
		}
	})
})();
