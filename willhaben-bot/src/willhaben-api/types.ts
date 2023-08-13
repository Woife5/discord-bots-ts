export type WillhabenResult = {
    id: string;
    verticalId: number;
    adTypeId: number;
    productId: number;
    advertStatus: {
        id: string;
        description: string;
        statusId: number;
    };
    description: string;
    selfLink: string;
    seo_url: string;
    location: string;
    heading: string;
    body_dyn: string;
    country: string;
    "price/amount": string;
    all_image_urls: string;
    price: number;
    price_for_display: string;
    published: number;
    enddate: number;
};
