
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Keypad.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/Keypad.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let button4;
    	let t9;
    	let button5;
    	let t11;
    	let button6;
    	let t13;
    	let button7;
    	let t15;
    	let button8;
    	let t17;
    	let button9;
    	let t18;
    	let button9_disabled_value;
    	let t19;
    	let button10;
    	let t21;
    	let button11;
    	let t22;
    	let button11_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "1";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "2";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "3";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "4";
    			t7 = space();
    			button4 = element("button");
    			button4.textContent = "5";
    			t9 = space();
    			button5 = element("button");
    			button5.textContent = "6";
    			t11 = space();
    			button6 = element("button");
    			button6.textContent = "7";
    			t13 = space();
    			button7 = element("button");
    			button7.textContent = "8";
    			t15 = space();
    			button8 = element("button");
    			button8.textContent = "9";
    			t17 = space();
    			button9 = element("button");
    			t18 = text("Löschen");
    			t19 = space();
    			button10 = element("button");
    			button10.textContent = "0";
    			t21 = space();
    			button11 = element("button");
    			t22 = text("OK");
    			attr_dev(button0, "class", "svelte-tun7qd");
    			add_location(button0, file$1, 28, 1, 515);
    			attr_dev(button1, "class", "svelte-tun7qd");
    			add_location(button1, file$1, 29, 1, 556);
    			attr_dev(button2, "class", "svelte-tun7qd");
    			add_location(button2, file$1, 30, 1, 597);
    			attr_dev(button3, "class", "svelte-tun7qd");
    			add_location(button3, file$1, 31, 1, 638);
    			attr_dev(button4, "class", "svelte-tun7qd");
    			add_location(button4, file$1, 32, 1, 679);
    			attr_dev(button5, "class", "svelte-tun7qd");
    			add_location(button5, file$1, 33, 1, 720);
    			attr_dev(button6, "class", "svelte-tun7qd");
    			add_location(button6, file$1, 34, 1, 761);
    			attr_dev(button7, "class", "svelte-tun7qd");
    			add_location(button7, file$1, 35, 1, 802);
    			attr_dev(button8, "class", "svelte-tun7qd");
    			add_location(button8, file$1, 36, 1, 843);
    			button9.disabled = button9_disabled_value = !/*value*/ ctx[0];
    			attr_dev(button9, "class", "svelte-tun7qd");
    			add_location(button9, file$1, 38, 1, 885);
    			attr_dev(button10, "class", "svelte-tun7qd");
    			add_location(button10, file$1, 39, 1, 946);
    			button11.disabled = button11_disabled_value = !/*value*/ ctx[0];
    			attr_dev(button11, "class", "svelte-tun7qd");
    			add_location(button11, file$1, 40, 1, 987);
    			attr_dev(div, "class", "keypad svelte-tun7qd");
    			add_location(div, file$1, 27, 0, 493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(div, t7);
    			append_dev(div, button4);
    			append_dev(div, t9);
    			append_dev(div, button5);
    			append_dev(div, t11);
    			append_dev(div, button6);
    			append_dev(div, t13);
    			append_dev(div, button7);
    			append_dev(div, t15);
    			append_dev(div, button8);
    			append_dev(div, t17);
    			append_dev(div, button9);
    			append_dev(button9, t18);
    			append_dev(div, t19);
    			append_dev(div, button10);
    			append_dev(div, t21);
    			append_dev(div, button11);
    			append_dev(button11, t22);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*select*/ ctx[1](1), false, false, false),
    					listen_dev(button1, "click", /*select*/ ctx[1](2), false, false, false),
    					listen_dev(button2, "click", /*select*/ ctx[1](3), false, false, false),
    					listen_dev(button3, "click", /*select*/ ctx[1](4), false, false, false),
    					listen_dev(button4, "click", /*select*/ ctx[1](5), false, false, false),
    					listen_dev(button5, "click", /*select*/ ctx[1](6), false, false, false),
    					listen_dev(button6, "click", /*select*/ ctx[1](7), false, false, false),
    					listen_dev(button7, "click", /*select*/ ctx[1](8), false, false, false),
    					listen_dev(button8, "click", /*select*/ ctx[1](9), false, false, false),
    					listen_dev(button9, "click", /*clear*/ ctx[2], false, false, false),
    					listen_dev(button10, "click", /*select*/ ctx[1](0), false, false, false),
    					listen_dev(button11, "click", /*submit*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && button9_disabled_value !== (button9_disabled_value = !/*value*/ ctx[0])) {
    				prop_dev(button9, "disabled", button9_disabled_value);
    			}

    			if (dirty & /*value*/ 1 && button11_disabled_value !== (button11_disabled_value = !/*value*/ ctx[0])) {
    				prop_dev(button11, "disabled", button11_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Keypad", slots, []);
    	let { value = "" } = $$props;
    	const dispatch = createEventDispatcher();
    	const select = num => () => $$invalidate(0, value += num);
    	const clear = () => $$invalidate(0, value = "");
    	const submit = () => dispatch("submit");
    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Keypad> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		value,
    		dispatch,
    		select,
    		clear,
    		submit
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, select, clear, submit];
    }

    class Keypad extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Keypad",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get value() {
    		throw new Error("<Keypad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Keypad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const name = writable('Test');
    const level = writable(10);
    const alloperations = readable(['+','-',':','*']);
    const alllevels = readable([10,20,50,100]);
    const lastdate = new Date();
    const results = {ok:[],false:[],date: lastdate};

    /* src/App.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (83:4) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let t_value = /*thelevel*/ ctx[18] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			add_location(button, file, 83, 5, 1775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*updatetask*/ ctx[10](/*thelevel*/ ctx[18], /*operation*/ ctx[5]))) /*updatetask*/ ctx[10](/*thelevel*/ ctx[18], /*operation*/ ctx[5]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$alllevels*/ 128 && t_value !== (t_value = /*thelevel*/ ctx[18] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(83:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if thelevel===$level}
    function create_if_block_1(ctx) {
    	let button;
    	let t_value = /*thelevel*/ ctx[18] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			set_style(button, "color", "#e73c7e");
    			add_location(button, file, 81, 5, 1685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*newtask*/ ctx[11](), false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$alllevels*/ 128 && t_value !== (t_value = /*thelevel*/ ctx[18] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:4) {#if thelevel===$level}",
    		ctx
    	});

    	return block;
    }

    // (80:4) {#each $alllevels as thelevel}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*thelevel*/ ctx[18] === /*$level*/ ctx[6]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(80:4) {#each $alllevels as thelevel}",
    		ctx
    	});

    	return block;
    }

    // (94:3) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*theop*/ ctx[15] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("  ");
    			t1 = text(t1_value);
    			t2 = text("  ");
    			add_location(button, file, 94, 4, 2066);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*updatetask*/ ctx[10](/*$level*/ ctx[6], /*theop*/ ctx[15]))) /*updatetask*/ ctx[10](/*$level*/ ctx[6], /*theop*/ ctx[15]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$alloperations*/ 256 && t1_value !== (t1_value = /*theop*/ ctx[15] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(94:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (92:3) {#if operation===theop}
    function create_if_block(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*theop*/ ctx[15] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("  ");
    			t1 = text(t1_value);
    			t2 = text("  ");
    			set_style(button, "color", "#e73c7e");
    			add_location(button, file, 92, 4, 1978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$alloperations*/ 256 && t1_value !== (t1_value = /*theop*/ ctx[15] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(92:3) {#if operation===theop}",
    		ctx
    	});

    	return block;
    }

    // (91:3) {#each $alloperations as theop}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*operation*/ ctx[5] === /*theop*/ ctx[15]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(91:3) {#each $alloperations as theop}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let h30;
    	let t3;
    	let p0;
    	let t5;
    	let t6;
    	let p1;
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let div3;
    	let h31;
    	let t12;
    	let span;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let p2;
    	let t20;
    	let div4;
    	let keypad;
    	let updating_value;
    	let t21;
    	let div5;
    	let h32;
    	let t23;
    	let p3;
    	let t24;
    	let t25;
    	let t26;
    	let p4;
    	let t27;
    	let t28;
    	let current;
    	let each_value_1 = /*$alllevels*/ ctx[7];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$alloperations*/ ctx[8];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function keypad_value_binding(value) {
    		/*keypad_value_binding*/ ctx[13](value);
    	}

    	let keypad_props = {};

    	if (/*res*/ ctx[4] !== void 0) {
    		keypad_props.value = /*res*/ ctx[4];
    	}

    	keypad = new Keypad({ props: keypad_props, $$inline: true });
    	binding_callbacks.push(() => bind(keypad, "value", keypad_value_binding));
    	keypad.$on("submit", /*checkres*/ ctx[12]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Rechentrainer";
    			t1 = space();
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Einstellungen";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Schwierigkeitsgrad";
    			t5 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Rechenart";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			div2 = element("div");
    			t10 = space();
    			div3 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Deine Aufgabe";
    			t12 = space();
    			span = element("span");
    			t13 = text(/*a*/ ctx[0]);
    			t14 = text(/*operation*/ ctx[5]);
    			t15 = text(/*b*/ ctx[1]);
    			t16 = text(" = ");
    			t17 = text(/*res*/ ctx[4]);
    			t18 = space();
    			p2 = element("p");
    			p2.textContent = `${/*check*/ ctx[9]}`;
    			t20 = space();
    			div4 = element("div");
    			create_component(keypad.$$.fragment);
    			t21 = space();
    			div5 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Deine Punkte";
    			t23 = space();
    			p3 = element("p");
    			t24 = text("Richtig: ");
    			t25 = text(/*good*/ ctx[2]);
    			t26 = space();
    			p4 = element("p");
    			t27 = text("Falsch: ");
    			t28 = text(/*wrong*/ ctx[3]);
    			attr_dev(h1, "class", "svelte-pwom2b");
    			add_location(h1, file, 73, 9, 1405);
    			add_location(div0, file, 73, 4, 1400);
    			attr_dev(h30, "class", "svelte-pwom2b");
    			add_location(h30, file, 75, 12, 1463);
    			add_location(p0, file, 77, 12, 1587);
    			add_location(p1, file, 89, 12, 1891);
    			add_location(div1, file, 74, 8, 1445);
    			add_location(div2, file, 99, 8, 2204);
    			attr_dev(h31, "class", "svelte-pwom2b");
    			add_location(h31, file, 104, 3, 2269);
    			attr_dev(span, "class", "huge svelte-pwom2b");
    			add_location(span, file, 105, 3, 2295);
    			add_location(p2, file, 106, 3, 2351);
    			attr_dev(div3, "class", "centered");
    			add_location(div3, file, 103, 2, 2243);
    			set_style(div4, "display", "flex");
    			set_style(div4, "justify-content", "space-around");
    			add_location(div4, file, 109, 3, 2381);
    			attr_dev(h32, "class", "svelte-pwom2b");
    			add_location(h32, file, 113, 12, 2527);
    			add_location(p3, file, 114, 3, 2552);
    			add_location(p4, file, 115, 3, 2578);
    			add_location(div5, file, 112, 8, 2509);
    			attr_dev(main, "class", "svelte-pwom2b");
    			add_location(main, file, 72, 0, 1389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t3);
    			append_dev(div1, p0);
    			append_dev(div1, t5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			append_dev(div1, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(main, t9);
    			append_dev(main, div2);
    			append_dev(main, t10);
    			append_dev(main, div3);
    			append_dev(div3, h31);
    			append_dev(div3, t12);
    			append_dev(div3, span);
    			append_dev(span, t13);
    			append_dev(span, t14);
    			append_dev(span, t15);
    			append_dev(span, t16);
    			append_dev(span, t17);
    			append_dev(div3, t18);
    			append_dev(div3, p2);
    			append_dev(main, t20);
    			append_dev(main, div4);
    			mount_component(keypad, div4, null);
    			append_dev(main, t21);
    			append_dev(main, div5);
    			append_dev(div5, h32);
    			append_dev(div5, t23);
    			append_dev(div5, p3);
    			append_dev(p3, t24);
    			append_dev(p3, t25);
    			append_dev(div5, t26);
    			append_dev(div5, p4);
    			append_dev(p4, t27);
    			append_dev(p4, t28);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newtask, $alllevels, $level, updatetask, operation*/ 3296) {
    				each_value_1 = /*$alllevels*/ ctx[7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, t6);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*$alloperations, operation, updatetask, $level*/ 1376) {
    				each_value = /*$alloperations*/ ctx[8];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*a*/ 1) set_data_dev(t13, /*a*/ ctx[0]);
    			if (!current || dirty & /*operation*/ 32) set_data_dev(t14, /*operation*/ ctx[5]);
    			if (!current || dirty & /*b*/ 2) set_data_dev(t15, /*b*/ ctx[1]);
    			if (!current || dirty & /*res*/ 16) set_data_dev(t17, /*res*/ ctx[4]);
    			const keypad_changes = {};

    			if (!updating_value && dirty & /*res*/ 16) {
    				updating_value = true;
    				keypad_changes.value = /*res*/ ctx[4];
    				add_flush_callback(() => updating_value = false);
    			}

    			keypad.$set(keypad_changes);
    			if (!current || dirty & /*good*/ 4) set_data_dev(t25, /*good*/ ctx[2]);
    			if (!current || dirty & /*wrong*/ 8) set_data_dev(t28, /*wrong*/ ctx[3]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(keypad.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(keypad.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			destroy_component(keypad);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $level;
    	let $alllevels;
    	let $alloperations;
    	validate_store(level, "level");
    	component_subscribe($$self, level, $$value => $$invalidate(6, $level = $$value));
    	validate_store(alllevels, "alllevels");
    	component_subscribe($$self, alllevels, $$value => $$invalidate(7, $alllevels = $$value));
    	validate_store(alloperations, "alloperations");
    	component_subscribe($$self, alloperations, $$value => $$invalidate(8, $alloperations = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let a = 1;
    	let b = 2;
    	let desired = 3;
    	let good = 0;
    	let wrong = 0;
    	let res = "";
    	let check = "";
    	let operation = "+";

    	onMount(async => {
    		newtask();
    	});

    	function updatetask(thelevel, theoperation) {
    		level.set(thelevel);
    		$$invalidate(5, operation = theoperation);
    		newtask();
    	}

    	function newtask() {
    		$$invalidate(4, res = "");
    		let num1 = Math.round(Math.random() * $level);
    		let num2 = Math.round(Math.random() * $level);

    		if (operation == "+") {
    			desired = Math.max(num1, num2);
    			$$invalidate(0, a = Math.min(num1, num2));
    			$$invalidate(1, b = desired - a);
    		}

    		if (operation == "-") {
    			desired = Math.min(num1, num2);
    			$$invalidate(1, b = Math.min(num1, num2));
    			$$invalidate(0, a = b + desired);
    		}

    		if (operation == "*") {
    			desired = Math.round(num2 / 2 + 1);
    			$$invalidate(1, b = Math.round(num1 / 3 + 1));
    			$$invalidate(0, a = Math.floor(desired / b));
    			desired = a * b;
    		}

    		if (operation == ":") {
    			desired = Math.round(num2 / 2 + 1);
    			$$invalidate(1, b = Math.round(num1 / 3 + 1));
    			$$invalidate(0, a = Math.floor(desired * b));
    			desired = a / b;
    		}
    	}

    	const checkres = () => {
    		let check = res == desired;

    		if (check) {
    			results["ok"].push({ a, b, operation });
    			$$invalidate(2, good = results["ok"].length);
    		} else {
    			results["false"].push({ a, b, operation });
    			$$invalidate(3, wrong = results["false"].length);
    		}

    		newtask();
    		console.log(results);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function keypad_value_binding(value) {
    		res = value;
    		$$invalidate(4, res);
    	}

    	$$self.$capture_state = () => ({
    		Keypad,
    		level,
    		name,
    		results,
    		alllevels,
    		alloperations,
    		onMount,
    		a,
    		b,
    		desired,
    		good,
    		wrong,
    		res,
    		check,
    		operation,
    		updatetask,
    		newtask,
    		checkres,
    		$level,
    		$alllevels,
    		$alloperations
    	});

    	$$self.$inject_state = $$props => {
    		if ("a" in $$props) $$invalidate(0, a = $$props.a);
    		if ("b" in $$props) $$invalidate(1, b = $$props.b);
    		if ("desired" in $$props) desired = $$props.desired;
    		if ("good" in $$props) $$invalidate(2, good = $$props.good);
    		if ("wrong" in $$props) $$invalidate(3, wrong = $$props.wrong);
    		if ("res" in $$props) $$invalidate(4, res = $$props.res);
    		if ("check" in $$props) $$invalidate(9, check = $$props.check);
    		if ("operation" in $$props) $$invalidate(5, operation = $$props.operation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		a,
    		b,
    		good,
    		wrong,
    		res,
    		operation,
    		$level,
    		$alllevels,
    		$alloperations,
    		check,
    		updatetask,
    		newtask,
    		checkres,
    		keypad_value_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
