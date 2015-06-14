class Title {

    public static oldTitle: string = $('title').text();

    public static change(newTitle?: string) {
        newTitle = (newTitle === undefined ? Title.oldTitle : newTitle);
        $('title').text(newTitle);
    }
}

export = Title;
