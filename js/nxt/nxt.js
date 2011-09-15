(function(window, undefined) {

    var Nxt = (function() {

        var _x = window.x;
        var _nxt = window.nxt;

        var merge = function (destination, properties, filter) {
            // The filter argument is optional, if no filter is provided, all values pass the filter and will be merged into the destination object
            filter = filter || function () { return true; };
            
            if (destination && properties && typeof properties === 'object') {
                for (var property in properties) {
                    if (filter(property, destination, properties) && properties[property] !== undefined) {
                        destination[property] = properties[property];
                    }
                }
            }
            
            return destination;
        }
        
        var override = function (destination, properties) {
            return merge(destination.prototype, properties);   
        }
        
        var ensure = function (o, config) {
            if (config instanceof o === false) {
                config = new o(config);   
            }
            return config;
        }
        
        // Nxt root constructor
        var Nxt = function () {};
        Nxt.merge = merge;
        Nxt.ensure = ensure;
        Nxt.extend = function (properties) {
            var superclass = this;
            var subclass = properties.hasOwnProperty('constructor') ? properties.constructor : function () { return superclass.apply(this, arguments); };
                        
            function F() {}
            F.prototype = superclass.prototype;
            subclass.prototype = new F();
            subclass.prototype.constructor = subclass.prototype;

            // when the object is extended, a superclass reference can be called from the subclass to access the superclass.
            override(
                subclass, 
                merge(
                    properties, { 
                        'superclass' : superclass.prototype
                    }
                )
            );

            merge(subclass, {
                'extend' : superclass.extend
            });
            
            return subclass;
        }
    
        return Nxt;
    
    })();
    
    window.Nxt = Nxt;
    
})(window);

var NewsItem = Nxt.extend({
    constructor : function (config) {
        var defaults = {
            'title' : 'Standaard titel',
            'content' : 'Standaard tekst'
        }
        this.config = Nxt.merge(defaults, config);
    },
    getTitle : function () {
        return this.config.title;   
    },
    getContent : function () {
        return this.config.content;   
    },
    getAuthor : function () {
        // enables lazy object creation
        return Nxt.ensure(Author, this.config.author);
    }
});

var Author = Nxt.extend({
    constructor : function (config) {
        this.config = config;   
    },
    getUsername : function () {
        return this.config.username;
    }
});

var List = Nxt.extend({
    constructor : function () {
        this.clear();   
    },
    add : function (item) {
        this.items.push(item);
    },
    clear : function () {
        this.items = [];  
    },
    length : function () {
        return this.items.length;
    },
    getItems : function () {
        return this.items;   
    },
    reverse : function () {
        this.items = this.items.reverse();
    }
});

var ListItem = Nxt.extend({
    constructor : function (title) {
        this.title = title;   
    },
    getTitle : function () {
        return this.title;   
    }
});

var NxtView = Nxt.extend({
    constructor : function (properties) {
        
        this.properties = Nxt.merge({
            model : undefined
        }, properties);
        
        var model = this.properties.model;
        
        var self = this;
        $.each(this.events || {}, function (index, event) {
            var original = model[index];
            
            model[index] = function () {
                original.apply(model, arguments); 
                self[event].apply(self, arguments);
            }
            
        });
        this.render();
    }
});

(function($) {
    
    $(document).ready(function () {
        
        var ListView = NxtView.extend({
            element : $('body'),
            events : {
                add : 'addItem',
                reverse : 'render',
                clear : 'render'
            },
            render : function () {
                if (this.list == undefined) {
                    this.list = $('<ul>');
                    this.element.append(this.list);
                }
                var self = this;
                this.list.html('');
                $.each(this.properties.model.getItems(), function (index, item) {
                    self.addItem(item);
                });
            },
            
            addItem : function (item) {
                this.list.append($('<li>').html(item.getTitle()));
            }
        });
        
        var LastListItemView = NxtView.extend({
            element : $('body'),
            events : {
                add : 'addItem'
            },
            render : function () {
                if (this.div == undefined) {
                    this.div = $('<div>');
                    this.element.append(this.div);
                }
            },
            addItem : function (item) {
                this.div.html('Het laatste item wat is toegevoegd is: ' + item.getTitle());
            }
        });
        
        var AddButtonView = NxtView.extend({
            element : $('body'),
            render : function () {
                var model = this.properties.model;
                this.button = $('<button>')
                    .html('Add list item')
                    .click(function () {
                        model.add(new ListItem('List Item ' + (model.length() + 1)));
                    })
                ;
                
                this.element.append(this.button);
            }
        });
        
        var ReverseButtonView = NxtView.extend({
            element : $('body'),
            render : function () {
                var model = this.properties.model;
                this.button = $('<button>')
                    .html('Reverse list')
                    .click(function () {
                        model.reverse();
                    })
                ;
                
                this.element.append(this.button);   
            }
        });
        
        var ClearButtonView = NxtView.extend({
            element : $('body'),
            render : function () {
                var self = this;
                this.button = $('<button>')
                    .html('Clear')
                    .click(function () {
                        self.properties.model.clear();
                    })
                ;
                
                this.element.append(this.button);   
            }
        });
        
        var list = new List();
        list.add(new ListItem('Begin'));
        
        var addButtonView = new AddButtonView({ 'model' : list });
        var reverseButtonView = new ReverseButtonView({ 'model' : list });
        var clearButtonView = new ClearButtonView({ 'model' : list });
        var lastListItemView = new LastListItemView({ 'model' : list });
        var listView = new ListView({ 'model' : list });
    });
})(jQuery);

/*
var cni = new CategorizedNewsItem('Title 1', 'Content 1', 'Category 1');
alert(cni.getCategory() + ', ' + cni.getTitle() + ', ' + cni.getContent());

var cni1 = new CategorizedNewsItem('Title 2', 'Content 2', 'Category 2');
alert(cni1.getCategory() + ', ' + cni1.getTitle() + ', ' + cni1.getContent());
cni1.setCategory('Category 2.A');
alert(cni1.getCategory() + ', ' + cni.getCategory());
*/

/*
var newsItem = new NewsItem('Title', 'Content');
alert(newsItem.getTitle());
*/