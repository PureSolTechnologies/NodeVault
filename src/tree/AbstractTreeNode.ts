import { TreeNode } from './TreeNode.js';

export abstract class AbstractTreeNode<NodeType extends TreeNode<NodeType>> implements TreeNode<NodeType> {

    children: NodeType[] = [];

    constructor(readonly parent: NodeType | undefined) {
        if (parent) {
            parent.children.push((this as unknown) as NodeType);
        }
    }

    abstract equals(other: NodeType): boolean;

    public hasChild(child: NodeType): boolean {
        return this.children.find(node => node.equals(child)) !== undefined;
    }

    public removeChild(child: NodeType): boolean {
        const startSize = this.children.length;
        const children = this.children.filter(c => !c.equals(child));
        this.children = children;
        return startSize > this.children.length;
    }

    public level(): number {
        let level = 0;
        let current: TreeNode<NodeType> | undefined = this;
        while (current.parent) {
            level++;
            current = current.parent;
        }
        return level;
    }

    public findSpecificChild(condition: (node: NodeType) => boolean): NodeType | undefined {
        return this.children.find(node => condition(node));
    }

}