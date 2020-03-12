export interface Story {
    _id: string;
    title: string;
    slug: string;
    contents: Content[];
}

export interface Content<T = any> {
    _id: string;
    type: string;
    label: string;
    fields: T
}
