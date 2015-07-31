
import { Component } from './component';
import { ComposerDOMElement } from './DOMElement';
import Debug from './debug';
import * as u from './utils';

export function createElement(
    element: string | (new(props: Props, children: Child[]) => Component<any, any, any>),
    props: any,
    ...children: Child[]): JSX.Element {

    let component: IComponent;
    let isChildOfRootElement = false;

    function setComponent(c: IComponent) {
        component = c;
    }

    function markAsChildOfRootElement() {
        isChildOfRootElement = true;
    }

    function toDOM(): DocumentFragment {
        let frag = document.createDocumentFragment();
        if (typeof element === 'string') {
            let root = document.createElement(element);

            if (!component.hasRenderedFirstElement) {
                component.root = new ComposerDOMElement(root);
                root.setAttribute('id', component.props.id);
                component.hasRenderedFirstElement = true;
            }

            for (let p in props) {
                if (p === 'id') {
                    continue;
                }
                else if (p === 'ref') {
                    let ref = props[p];
                    if (ref in component.elements) {
                        Debug.warn(`You are overriding the element reference '{0}'.`, ref);
                    }
                    root.setAttribute('data-ref', ref);
                    component.elements[ref] = new ComposerDOMElement(root);
                }
                else {
                    root.setAttribute(convertCamelCasesToDashes(p), props[p]);
                }
            }

            for (let child of children) {
                if (typeof child === 'string') {
                    root.textContent += child;
                }
                else if (u.isArray<JSX.Element[]>(child)) {
                    for (let c of child) {
                        setComponentAndPushElementComponentAndMarkChildOfRootElementAndAppendChild(root, c);
                    }
                }
                else {
                    setComponentAndPushElementComponentAndMarkChildOfRootElementAndAppendChild(root, child);
                }
            }

            frag.appendChild(root);

            // If the current element is root element of a component. Then we want to
            // reset the first rendered element flag. Otherwise, child of root
            // elements can cause some the next sibling child to render the id
            // attribute. And we don't want that to happen. Only the root element
            // should render an id by default.
            if (!isChildOfRootElement) {

                // Reset rendered first element flag so we can render the id again.
                component.hasRenderedFirstElement = false;
            }
        }
        else {
            let el = new element(props, children);
            frag.appendChild(el.toDOM());

            // There is no component for children custom elements. This is only being set
            // when we encounter a custom element on the root (<C1 id="i1"></C1>).
            if (component) {
                component.customElements.push(el);
            }
        }

        return frag;

        function setComponentAndPushElementComponentAndMarkChildOfRootElementAndAppendChild(root: HTMLElement, child: JSX.Element) {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.markAsChildOfRootElement();
            }
            else {
                component.customElements.push(child.getComponent());
            }
            root.appendChild(child.toDOM());
        }
    }

    function convertCamelCasesToDashes(text: string) {
        return text.replace(/([A-Z])/g, (m) => {
            return '-' + m.toLowerCase();
        });
    }

    function toString(): string {
        let frag = '';
        if (typeof element === 'string') {
            frag = `<${element}`;

            if (!component.hasRenderedFirstElement) {
                frag += ` id="${component.props.id}"`;
            }

            for (let p in props) {
                if (typeof props[p] !== 'boolean' && typeof props[p] !== 'string') {
                    continue;
                }
                if (p === 'id' && !component.hasRenderedFirstElement) {
                    continue;
                }
                if (typeof props[p] === 'boolean') {
                    frag += ` ${convertCamelCasesToDashes(p)}`;
                }
                else if (p === 'ref') {
                    frag += ` data-ref="${props[p]}"`;
                }
                else {
                    frag += ` ${convertCamelCasesToDashes(p)}="${props[p]}"`;
                }
            }

            frag += '>';

            component.hasRenderedFirstElement = true;

            for (let child of children) {
                if (typeof child === 'string') {
                    frag += child;
                }
                else if (u.isArray<JSX.Element[]>(child)) {
                    for (let c of child) {
                        frag += setComponentAndMarkChildOfRootElementAndRenderToString(c);
                    }
                }
                else {
                    frag += setComponentAndMarkChildOfRootElementAndRenderToString(child);
                }
            }

            frag += `</${element}>`;

            // If the current element is root element of a component. Then we want to
            // reset the first rendered element flag. Otherwise, child of root
            // elements can cause some the next sibling child to render the id
            // attribute. And we don't want that to happen. Only the root element
            // should render an id by default.
            if (!isChildOfRootElement) {

                // Reset rendered first element flag so we can render the id again.
                component.hasRenderedFirstElement = false;
            }
        }
        else {
            let el = new element(props, children);
            frag += el.toString();
        }

        return frag;

        function setComponentAndMarkChildOfRootElementAndRenderToString(child: JSX.Element): string {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.markAsChildOfRootElement();
            }
            return child.toString();
        }
    }

    /**
     * Set references by binding the elements to the component. Should only
     * be called by the composer router.
     */
    function bindDOM(): void {
        if (typeof element === 'string') {
            let root = document.getElementById(component.props.id);
            if (!root) {
                Debug.error(`Could not bind root element '{0}'.`, component.props.id);
            }
            component.root = new ComposerDOMElement(root);

            for (let p in props) {
                if (p === 'ref') {
                    let ref = props[p];
                    if (ref in component.elements) {
                        Debug.warn(`You are overriding the element reference '{0}'.`, ref);
                    }

                    let referencedElement = component.root.findOne(`[data-ref="${ref}"]`);
                    if (!referencedElement) {
                        Debug.error(`Could not bind referenced element '{0}'.`, ref);
                    }
                    component.elements[ref] = new ComposerDOMElement(referencedElement);
                }
            }

            for (let child of children) {
                if (typeof child === 'string') {
                    continue;
                }
                else if (u.isArray<JSX.Element[]>(child)) {
                    for (let c of child) {
                        if (c.isIntrinsic) {
                            c.setComponent(component);
                            c.bindDOM();
                        }
                        else {
                            c.bindDOM();
                            component.customElements.push(c.getComponent());
                        }
                    }
                }
                else {
                    if (child.isIntrinsic) {
                        child.setComponent(component);
                        child.bindDOM();
                    }
                    else {
                        child.bindDOM();
                        component.customElements.push(child.getComponent());
                    }
                }
            }
        }
        else {
            let el = component = new element(props, children);
            el.bindDOM();
        }
    }

    return {
        toDOM,
        toString,
        setComponent,
        bindDOM,
        isIntrinsic: typeof element === 'string',
        getComponent: () => component,
        markAsChildOfRootElement,
    }
}