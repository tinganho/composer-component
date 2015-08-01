
/// <reference path='../../typings/es6-promise/es6-promise.d.ts' />
/// <reference path='../../typings/express/express.d.ts' />
/// <reference path='../lib/jsx.d.ts' />

import { Platform, getPlatform } from './platform';
import { Debug } from './debug';

export abstract class Component<P extends Props, S, E extends Elements> implements IComponent {

    /**
     * Root element of the component view.
     */
    public root: DOMElement;

    /**
     * Referenced elements from component.
     */
    public elements: E;

    /**
     * Current state of component.
     */
    public states: S;

    /**
     * Put your localization strings here.
     */
    public l10ns: any;

    /**
     * Platform flags.
     */
    public platform: Platform;

    /* @internal */
    public hasRenderedFirstElement = false;

    /* @internal */
    public hasBoundDom = false;

    /* @internal */
    public children: Child[];

    /* @internal */
    public customElements: IComponent[] = [];

    constructor(
        public props: P,
        children?: Child[]) {

        if (!this.props || !this.props.id) {
            Debug.error('You must define an id for your component {0}', (this.constructor as any).name);
        }
        this.children = children;
        (this as any).elements = {}
    }

    /**
     * Define you render with JSX elements.
     */
    public abstract render(): JSX.Element;

    /**
     * The remove function is called be the router whenever we switch pages and
     * want to remove some components. This remove function is called immediately
     * after fetching of the new page is finished.
     */
    public remove(): Promise<void> {
        this.root.remove();
        return Promise.resolve(undefined);
    }

    /**
     * Hide is called immediately after a route have been matched and the current
     * component does not belong to the next page. This function is suitable to do
     * some hiding animation or display load bars before next page is being rendered.
     */
    public hide(): Promise<void> {
        return Promise.resolve(undefined);
    }

    /**
     * Show is called during initial page load or directly after having switched to
     * a new page. If your component are hidden with styles during initial page load
     * it is now suitable to show them with this function. Show is also called whenever
     * a page request failed to unhide components.
     */
    public show(): Promise<void> {
        return Promise.resolve(undefined);
    }

    /**
     * Fetch is called everytime we switch to a new page. Each component on each page
     * needs to be finished loading before the new page is showned.
     */
    public fetch(req: Express.Request): Promise<P> {
        return Promise.resolve(undefined);
    }

    /* @internal */
    public bindDOM(): void {
        this.renderAndSetComponent().bindDOM();
    }

    /**
     * Bind Interactions is the first function to be called during all page loads to bind the
     * component interactions with the DOM. All elements are already binded so there is no need
     * to bind them. Please bind any interactions that you find suitable.
     */
    public bindInteractions(): void {

    }

    /* @internal */
    public toString(): string {
        return this.renderAndSetComponent().toString();
    }

    /* @internal */
    public toDOM(): DocumentFragment {
        return this.renderAndSetComponent().toDOM();
    }

    /* @internal */
    private renderAndSetComponent(): JSX.Element {
        let component = this.render();
        component.setComponent(this);
        return component;
    }
}