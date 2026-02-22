export enum AnalyticsEventName {
    PAGE_VIEW = 'page_view',
    BUTTON_CLICK = 'button_click',
    FORM_SUBMIT = 'form_submit',
    CONVERSION = 'conversion',
    FUNNEL_STEP = 'funnel_step',
}

export type EventPayloads = {
    [AnalyticsEventName.PAGE_VIEW]: {
        url: string;
        title: string;
        referrer?: string;
    };
    [AnalyticsEventName.BUTTON_CLICK]: {
        button_id: string;
        text: string;
        location: string;
    };
    [AnalyticsEventName.FORM_SUBMIT]: {
        form_id: string;
        success: boolean;
        error?: string;
    };
    [AnalyticsEventName.CONVERSION]: {
        type: string;
        amount?: number;
        currency?: string;
        transaction_id?: string;
    };
    [AnalyticsEventName.FUNNEL_STEP]: {
        step: number;
        name: string;
        total_steps: number;
    };
};

export type AnalyticsEvent<T extends AnalyticsEventName> = {
    name: T;
    properties: EventPayloads[T];
};
