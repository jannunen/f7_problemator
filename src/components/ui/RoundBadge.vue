   <template>
     <div class="roundbadge" :style="getStyle">
         <div> <slot></slot> </div>
    </div> 
   </template>
   
   <script>
   export default {
       props : {
           borderColor : {
               type : String,
               default : "#000"
           },
           bgColor : {
               type : String,
               default : "#fff",
           },
           width : {
               type : Number,
               default : 32,
           },
           textColor  : {
               type : String,
               default : "#000",
           }

       },
       computed : {
           getStyle() {
               const style = `
               border-color : ${this.borderColor}; 
               background-color : ${this.bgColor};
               width : ${this.width}px;
               height : ${this.width}px;
               color : ${this.textColor};
               `
               return style
           },
           getBadgeStyle() {

           }
       }
   }
   </script>
   
   <style scoped>
       .roundbadge  {
           display: block;
           border-style : solid;
           position : relative;
           text-align : center;
           border-radius : 18px;
           border-width : 1px;
           margin : 2px;

       }
       .roundbadge div {
           display: block;
           font-size : 16px;
           font-weight : bold;
           padding : 4px 4px 4px 4px;

       }
   </style> 