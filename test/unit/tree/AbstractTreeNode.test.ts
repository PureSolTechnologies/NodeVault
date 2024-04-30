import { describe, expect, test } from "@jest/globals";
import { AbstractTreeNode } from "../../../src/tree/AbstractTreeNode";

class TestNode extends AbstractTreeNode<TestNode> {

    constructor(parent: TestNode | undefined, readonly value: string) {
        super(parent)
    }

    equals(other: TestNode): boolean {
        return this.value == other.value;
    }

}

describe("AbstractTreeNode tests", () => {

    test("Test hasChild() and removeChild()", () => {
        const root = new TestNode(undefined, "root");
        const childA = new TestNode(root, "childA");
        const childC1 = new TestNode(childA, "childC");
        const childB = new TestNode(root, "childB");
        const childC2 = new TestNode(childB, "childC");

        expect(childA.hasChild(childC1)).toBeTruthy();
        expect(childB.hasChild(childC2)).toBeTruthy();

        childA.removeChild(childC1);

        expect(childA.hasChild(childC1)).toBeFalsy();
        expect(childB.hasChild(childC2)).toBeTruthy();
    });

});