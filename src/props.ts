import { ClassConstructor } from '.';
import { AttributeDescriptors } from './fit-element';

export default function withProps<OP>(descriptors: AttributeDescriptors<OP>) {
    return <T extends ClassConstructor<HTMLElement>>(clazz: T) => class extends clazz {
        static get properties() {
            return descriptors;
        }
    };
}
