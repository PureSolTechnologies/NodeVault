/**
 * Generic Tree interface.
 */
export interface TreeNode<NodeType extends TreeNode<NodeType>> {

    /**
     * Reference the parent node.
     */
    readonly parent: NodeType | undefined;

    /**
     * References the children nodes. This childen must not be manipulated 
     * from outside of the tree node implementations!
     */
    children: NodeType[];

    /**
     * A mandatory method to check for equality of two nodes. It checks this/the
     * current node with another one. How equality is check, is up to the 
     * implementation / use case.
     * @param other the other node to check against equality.
     */
    equals(other: NodeType): boolean;

    /**
     * Uses the equals(other) method to check for the presence of a child node.
     * @param child to be check for presence.
     */
    hasChild(child: NodeType): boolean;

    /**
     * This method removes a child from a node based on equals() method.
     * @param child is the child to be removed.
     * @returns True is retruned if a child was removed. False is returned otherwise.
     */
    removeChild(child: NodeType): boolean;
}
