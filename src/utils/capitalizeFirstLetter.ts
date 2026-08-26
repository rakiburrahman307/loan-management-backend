export const capitalizeFirstLetter = (values: string | null | undefined, allWords = false) => {
     if (!values) return '';
     if (allWords) {
          return values
               .split(' ')
               .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
     }
     return values.charAt(0).toUpperCase() + values.slice(1);
};
