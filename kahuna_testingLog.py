import pickle
from patsy import dmatrices
from sklearn.metrics import *
from sklearn.neighbors import KNeighborsClassifier
from sklearn.learning_curve import learning_curve
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.cross_validation import train_test_split, cross_val_score, cross_val_predict
from sklearn.preprocessing import label_binarize


with open('bigkahuna.pkl', 'r') as picklefile: 
    bigkahuna = pickle.load(picklefile)

y, X = dmatrices('flux ~ station_name + dayofwk + C(hour) + summary + temperature', data=bigkahuna, return_type='dataframe')

print 'Done design matrix-ing.'

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=1)

print 'Done train_test_splitting.'

Classifier = LogisticRegression(class_weight = 'auto')
Logmodel =  Classifier.fit(X_train, y_train)
Logpred = Logmodel.predict(X_test)

scores = [recall_score, accuracy_score, f1_score]

masterlist = []

for score in scores:
	masterlist.append({score:score(y_test, Logpred)})
	with open("KahunaLog.pkl", "w") as pklfile:
		pickle.dump(masterlist, pklfile)
	print "Ran and pickled", score

n_classes = [0,1,2]

y_b = label_binarize(y, classes=n_classes)
X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(X, y_b, test_size=0.25, random_state=1)
print 'Done binarizing and splitting.'

OVRClassifier = OneVsRestClassifier(LogisticRegression(class_weight = 'auto'))
OVRmodel = OVRClassifier.fit(X_train_b, y_train_b)
test_pred = OVRmodel.predict_proba(X_test_b)

fpr = dict()
tpr = dict()
roc_auc = dict()
for i in range(len(n_classes)):
    fpr[i], tpr[i], _ = roc_curve(y_test_b[:, i], test_pred[:, i])
    roc_auc[i] = auc(fpr[i], tpr[i])

roc_list = [fpr, tpr, roc_auc]
with open("KahunaLog_ROCAUC.pkl", "w") as pfile:
    pickle.dump(roc_list, pfile)

print 'done with roc_auc stuff too. finished.'