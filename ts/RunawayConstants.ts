module Constants {

    export enum RunStatus {
        NOT_RUNNING,
        RUNNING,
        NO_HOSTS
    }

    export enum ProgressStatus {
        NOT_RUNNING,
        RUNNING,
        SUCCESS,
        ERROR
    }
}

export = Constants;
